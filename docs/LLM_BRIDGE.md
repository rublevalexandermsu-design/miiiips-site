# LLM Bridge

This project now has a small local bridge for Ollama and Gemini workflows.

## Purpose

- keep prompts short and structured
- support large text workflows through chunked summarization
- keep Codex as the coordinator while Qwen acts as the local worker model
- optionally route text-heavy tasks through Gemini API to reduce local load
- avoid loading too much context into a single request

## Files

- `llm_bridge.py` - local HTTP bridge
- `run_llm_bridge.ps1` - start script

## Default models

- chat provider: `gemini`
- summary provider: `gemini`
- code provider: `ollama`
- Gemini chat/summary model: `gemini-2.5-flash`
- Ollama chat model: `qwen3:1.7b`
- Ollama code model: `qwen2.5-coder:1.5b`

## Endpoints

- `GET /api/health`
- `GET /api/models`
- `POST /api/chat`
- `POST /api/code`
- `POST /api/compact`
- `POST /api/task-card`

## Notes

- The bridge talks to Ollama on `http://127.0.0.1:11434` and Gemini API on `https://generativelanguage.googleapis.com/v1beta`.
- Set `GEMINI_API_KEY` or `gemini_api_key` in the local config to enable Gemini routing.
- For long texts, use `POST /api/compact` or `POST /api/task-card` instead of sending the whole document into one prompt.
- For site-only event workflows, set `scenario=site_only_event` and pass only the task assets.
- You can override the backend per request with `provider=gemini` or `provider=ollama`.
