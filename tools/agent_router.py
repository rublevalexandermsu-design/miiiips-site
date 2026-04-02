from __future__ import annotations

import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "assets" / "data" / "agent-orchestration.json"


def load_config() -> dict:
    return json.loads(CONFIG.read_text(encoding="utf-8-sig"))


def by_page(config: dict, page: str) -> list[dict]:
    matches = []
    for agent in config["agents"]:
        if "*" in agent.get("pages", []) or page in agent.get("pages", []):
            matches.append(agent)
    return matches


def by_domain(config: dict, domain: str) -> list[dict]:
    ids = config.get("routing", {}).get(domain, [])
    indexed = {agent["id"]: agent for agent in config["agents"]}
    return [indexed[i] for i in ids if i in indexed]


def render_agents(agents: list[dict]) -> str:
    if not agents:
        return "No matching agents"
    lines = []
    for agent in agents:
        lines.append(f"- {agent['role']} ({agent['id']})")
        if agent.get("skills"):
            lines.append(f"  skills: {', '.join(agent['skills'])}")
        if agent.get("domains"):
            lines.append(f"  domains: {', '.join(agent['domains'])}")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Route a task to the right MIIIIPS agents.")
    parser.add_argument("--page", help="HTML page name, e.g. publications.html")
    parser.add_argument("--domain", help="Domain name, e.g. events, courses, grants, research")
    parser.add_argument("--list", action="store_true", help="List all agents")
    args = parser.parse_args()

    config = load_config()

    if args.list:
        print(render_agents(config["agents"]))
        return 0

    if args.page:
        print(render_agents(by_page(config, args.page)))
        return 0

    if args.domain:
        print(render_agents(by_domain(config, args.domain)))
        return 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
