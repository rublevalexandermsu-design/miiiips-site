# LLM Bridge

This project now has a small local bridge for Ollama-based workflows.

## Purpose

- keep prompts short and structured
- support large text workflows through chunked summarization
- keep Codex as the coordinator while Qwen acts as the local worker model
- avoid loading too much context into a single request

## Files

- `llm_bridge.py` - local HTTP bridge
- `run_llm_bridge.ps1` - start script

## Default models

- chat: `qwen3:4b`
- code: `qwen2.5-coder:3b`
- summary: `qwen3:4b`

## Endpoints

- `GET /api/health`
- `GET /api/models`
- `POST /api/chat`
- `POST /api/code`
- `POST /api/compact`
- `POST /api/task-card`

## Notes

- The bridge talks to Ollama on `http://127.0.0.1:11434`.
- For long texts, use `POST /api/compact` or `POST /api/task-card` instead of sending the whole document into one prompt.
- For site-only event workflows, set `scenario=site_only_event` and pass only the task assets.
