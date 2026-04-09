from __future__ import annotations

import argparse
import base64
import hashlib
import json
import secrets
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Set password hash for internal-compliance dashboard.")
    parser.add_argument("password", help="Plaintext password to hash")
    parser.add_argument("--iterations", type=int, default=150000)
    parser.add_argument(
        "--config",
        default=str(Path(__file__).resolve().parents[1] / "assets" / "data" / "internal-compliance" / "compliance-config.json"),
        help="Path to compliance-config.json",
    )
    args = parser.parse_args()

    config_path = Path(args.config)
    payload = json.loads(config_path.read_text(encoding="utf-8"))
    salt = secrets.token_urlsafe(18)
    digest = hashlib.pbkdf2_hmac("sha256", args.password.encode("utf-8"), salt.encode("utf-8"), args.iterations, dklen=32)
    payload.setdefault("auth", {})
    payload["auth"]["salt"] = salt
    payload["auth"]["iterations"] = args.iterations
    payload["auth"]["hash"] = base64.b64encode(digest).decode("ascii")
    payload["auth"]["hint"] = "Пароль задан. Доступ открывается только после корректного ввода."
    config_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {config_path}")


if __name__ == "__main__":
    main()
