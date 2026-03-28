from __future__ import annotations

import argparse
import json
import os
import re
import sys
import textwrap
import urllib.error
import urllib.request
from datetime import datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DEFAULT_CONFIG_PATH = ROOT / 'local_api_config.json'
SAMPLE_CONFIG_PATH = ROOT / 'local_api_config.sample.json'
RUNTIME_DIR = ROOT / 'runtime'
LOG_FILE = RUNTIME_DIR / 'llm_bridge.log'

DEFAULTS = {
    'host': '127.0.0.1',
    'port': 3011,
    'ollama_base_url': 'http://127.0.0.1:11434',
    'chat_model': 'qwen3:1.7b',
    'code_model': 'qwen2.5-coder:1.5b',
    'summary_model': 'qwen3:1.7b',
    'num_ctx': 4096,
    'chunk_chars': 7000,
    'runtime_dir': str(RUNTIME_DIR),
}


def load_json(path: Path, fallback: Any):
    if path.exists():
        return json.loads(path.read_text(encoding='utf-8'))
    return fallback


def save_json(path: Path, payload: Any):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')


def merge_config() -> dict[str, Any]:
    config = dict(DEFAULTS)
    config.update(load_json(SAMPLE_CONFIG_PATH, {}))
    config.update(load_json(DEFAULT_CONFIG_PATH, {}))
    return config


def write_log(message: str):
    stamp = datetime.now().isoformat(timespec='seconds')
    line = f'[{stamp}] {message}\n'
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open('a', encoding='utf-8') as fh:
        fh.write(line)


def json_response(handler: BaseHTTPRequestHandler, payload: Any, status: HTTPStatus = HTTPStatus.OK):
    body = json.dumps(payload, ensure_ascii=False, indent=2).encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('Access-Control-Allow-Origin', '*')
    handler.end_headers()
    handler.wfile.write(body)


def read_request_json(handler: BaseHTTPRequestHandler) -> dict[str, Any]:
    length = int(handler.headers.get('Content-Length', '0') or '0')
    raw = handler.rfile.read(length) if length else b'{}'
    if not raw:
        return {}
    return json.loads(raw.decode('utf-8'))


def http_post_json(url: str, payload: dict[str, Any], timeout: int = 120) -> dict[str, Any]:
    data = json.dumps(payload).encode('utf-8')
    request = urllib.request.Request(
        url,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode('utf-8'))


def get_ollama_models(config: dict[str, Any]) -> list[dict[str, Any]]:
    base_url = config['ollama_base_url'].rstrip('/')
    try:
        request = urllib.request.Request(f'{base_url}/api/tags', method='GET')
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except Exception:
        return []
    return payload.get('models', [])


def chunk_text(text: str, chunk_chars: int) -> list[str]:
    text = text.strip()
    if len(text) <= chunk_chars:
        return [text]
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_chars, len(text))
        if end < len(text):
            split = text.rfind('\n\n', start, end)
            if split > start + chunk_chars // 3:
                end = split
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end
    return chunks


def scenario_system_prompt(scenario: str) -> str:
    prompts = {
        'general': (
            'You are a concise Russian-language project assistant. '
            'Keep answers structured, short, and action-oriented. '
            'Prefer bullet points, preserve dates, names, URLs, and ids.'
        ),
        'site_only_event': (
            'You are extracting a page/event from a single source website. '
            'Use only the supplied source content. Do not import external archive assets. '
            'Return a clean, concise structure for the site.'
        ),
        'thesis': (
            'You are helping with a long dissertation workflow. '
            'Focus on structure, argumentation, section hierarchy, gaps, contradictions, and concise rewriting. '
            'Avoid filler. Preserve terminology and references.'
        ),
        'rowing_video': (
            'You are analyzing rowing video/transcript workflows. '
            'Focus on signal extraction, motion cues, timing, technique issues, and noise reduction. '
            'Prefer compact task cards and observations.'
        ),
        'code': (
            'You are a coding assistant for local project automation. '
            'Focus on files, APIs, scripts, patches, and minimal safe changes. '
            'Return actionable steps and code-oriented recommendations.'
        ),
    }
    return prompts.get(scenario, prompts['general'])


def build_chat_payload(config: dict[str, Any], body: dict[str, Any], structured: bool = False) -> dict[str, Any]:
    model = body.get('model') or config.get('chat_model')
    scenario = body.get('scenario') or 'general'
    system = body.get('system') or scenario_system_prompt(scenario)
    messages = body.get('messages')
    prompt = body.get('prompt') or body.get('text') or ''

    if not messages:
        messages = []
        if system:
            messages.append({'role': 'system', 'content': system})
        if prompt:
            messages.append({'role': 'user', 'content': prompt})
    elif system:
        first_is_system = bool(messages) and messages[0].get('role') == 'system'
        if not first_is_system:
            messages = [{'role': 'system', 'content': system}] + list(messages)

    options = {
        'num_ctx': int(body.get('num_ctx') or config.get('num_ctx', 4096)),
    }
    temperature = body.get('temperature')
    if temperature is not None:
        options['temperature'] = temperature

    payload = {
        'model': model,
        'messages': messages,
        'stream': False,
        'options': options,
    }
    if structured:
        payload['format'] = 'json'
    return payload


def ollama_chat(config: dict[str, Any], body: dict[str, Any], structured: bool = False) -> dict[str, Any]:
    base_url = config['ollama_base_url'].rstrip('/')
    payload = build_chat_payload(config, body, structured=structured)
    raw = http_post_json(f'{base_url}/api/chat', payload, timeout=int(body.get('timeout') or 180))
    message = raw.get('message', {})
    content = message.get('content', '')
    result = {
        'model': payload['model'],
        'content': content,
        'raw': raw,
    }
    if structured:
        result['parsed'] = parse_jsonish(content)
    return result


def parse_jsonish(text: str) -> Any:
    text = text.strip()
    if not text:
        return {}
    try:
        return json.loads(text)
    except Exception:
        pass
    match = re.search(r'\{.*\}', text, flags=re.S)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    return {'raw': text}


def compact_text(config: dict[str, Any], body: dict[str, Any]) -> dict[str, Any]:
    text = (body.get('text') or body.get('prompt') or '').strip()
    goal = body.get('goal') or 'Compress this content for later retrieval.'
    scenario = body.get('scenario') or 'general'
    model = body.get('model') or config.get('summary_model') or config.get('chat_model')
    chunk_chars = int(body.get('chunk_chars') or config.get('chunk_chars', 7000))

    if not text:
        return {'ok': False, 'error': 'empty_text'}

    chunks = chunk_text(text, chunk_chars)
    summaries: list[str] = []
    for idx, chunk in enumerate(chunks, start=1):
        prompt = textwrap.dedent(f'''
        Goal: {goal}
        Scenario: {scenario}
        Chunk {idx}/{len(chunks)}:
        {chunk}

        Return a compact Russian summary with:
        - summary
        - key_points
        - tags
        - open_questions
        - next_actions
        Keep dates, names, URLs, and ids.
        ''').strip()
        chunk_result = ollama_chat(config, {
            'model': model,
            'scenario': scenario,
            'prompt': prompt,
            'num_ctx': body.get('num_ctx') or config.get('num_ctx', 4096),
            'temperature': body.get('temperature', 0.2),
        }, structured=True)
        parsed = chunk_result.get('parsed')
        if isinstance(parsed, dict):
            summaries.append(json.dumps(parsed, ensure_ascii=False))
        else:
            summaries.append(chunk_result.get('content', ''))

    if len(summaries) == 1:
        final = parse_jsonish(summaries[0])
        return {
            'ok': True,
            'model': model,
            'chunks': 1,
            'card': final,
        }

    final_prompt = textwrap.dedent(f'''
    Goal: {goal}
    Scenario: {scenario}
    Combine these chunk summaries into a single compact task card:
    {chr(10).join(f'- {s}' for s in summaries)}

    Return JSON with:
    - title
    - summary
    - key_points
    - tags
    - open_questions
    - next_actions
    - source_policy
    ''').strip()
    final_result = ollama_chat(config, {
        'model': model,
        'scenario': scenario,
        'prompt': final_prompt,
        'num_ctx': body.get('num_ctx') or config.get('num_ctx', 4096),
        'temperature': body.get('temperature', 0.2),
    }, structured=True)
    return {
        'ok': True,
        'model': model,
        'chunks': len(chunks),
        'card': final_result.get('parsed') or parse_jsonish(final_result.get('content', '')),
    }


def task_card(config: dict[str, Any], body: dict[str, Any]) -> dict[str, Any]:
    text = (body.get('text') or body.get('prompt') or '').strip()
    if not text:
        return {'ok': False, 'error': 'empty_text'}
    scenario = body.get('scenario') or 'general'
    model = body.get('model') or config.get('summary_model') or config.get('chat_model')
    policy = body.get('source_policy') or 'use_task_assets_only_if_relevant'

    prompt = textwrap.dedent(f'''
    Scenario: {scenario}
    Source policy: {policy}
    Task text:
    {text}

    Return JSON with:
    - intent
    - title
    - summary
    - source_policy
    - tags
    - entities
    - files_to_create
    - next_actions
    - risks
    - confidence

    Keep it concise, practical, and in Russian.
    ''').strip()
    result = ollama_chat(config, {
        'model': model,
        'scenario': scenario,
        'prompt': prompt,
        'num_ctx': body.get('num_ctx') or config.get('num_ctx', 4096),
        'temperature': body.get('temperature', 0.2),
    }, structured=True)
    return {
        'ok': True,
        'model': model,
        'card': result.get('parsed') or parse_jsonish(result.get('content', '')),
    }


class BridgeHandler(BaseHTTPRequestHandler):
    server_version = 'MIIIIPSBridge/1.0'

    @property
    def config(self) -> dict[str, Any]:
        return self.server.config  # type: ignore[attr-defined]

    def log_message(self, fmt, *args):
        msg = fmt % args
        sys.stdout.write(msg + '\n')
        write_log(msg)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/health':
            return json_response(self, {
                'ok': True,
                'time': datetime.now().isoformat(timespec='seconds'),
                'bridge': 'llm_bridge',
                'ollama_base_url': self.config['ollama_base_url'],
                'default_models': {
                    'chat': self.config['chat_model'],
                    'code': self.config['code_model'],
                    'summary': self.config['summary_model'],
                },
            })
        if path == '/api/models':
            models = get_ollama_models(self.config)
            return json_response(self, {'ok': True, 'models': models})
        self.send_error(HTTPStatus.NOT_FOUND, 'Unknown API endpoint')

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            body = read_request_json(self)
        except Exception as exc:
            return json_response(self, {'ok': False, 'error': f'bad_json: {exc}'}, HTTPStatus.BAD_REQUEST)

        try:
            if path == '/api/chat':
                return json_response(self, {'ok': True, **ollama_chat(self.config, body, structured=False)})
            if path == '/api/compact':
                return json_response(self, compact_text(self.config, body))
            if path == '/api/task-card':
                return json_response(self, task_card(self.config, body))
            if path == '/api/code':
                body = dict(body)
                body['model'] = body.get('model') or self.config.get('code_model')
                return json_response(self, {'ok': True, **ollama_chat(self.config, body, structured=False)})
        except urllib.error.URLError as exc:
            return json_response(self, {'ok': False, 'error': f'ollama_error: {exc}'}, HTTPStatus.BAD_GATEWAY)
        except Exception as exc:
            return json_response(self, {'ok': False, 'error': str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)

        return json_response(self, {'ok': False, 'error': 'unknown_endpoint'}, HTTPStatus.NOT_FOUND)


def main():
    parser = argparse.ArgumentParser(description='MIИИИПС local LLM bridge for Ollama.')
    parser.add_argument('--host', default=None)
    parser.add_argument('--port', type=int, default=None)
    args = parser.parse_args()

    config = merge_config()
    host = args.host or config.get('host', DEFAULTS['host'])
    port = args.port or int(config.get('port', DEFAULTS['port']))
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)

    server = ThreadingHTTPServer((host, port), BridgeHandler)
    server.config = config  # type: ignore[attr-defined]
    print(f'LLM bridge running at http://{host}:{port}/api/health', flush=True)
    write_log(f'LLM bridge started at http://{host}:{port}')
    server.serve_forever()


if __name__ == '__main__':
    main()
