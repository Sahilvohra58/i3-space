"""One-shot migrator: bcrypt-hash any plaintext passwords in the users sheet.

Run from the `backend/` folder with the venv active and `.env` loaded:

    cd backend
    source .venv/bin/activate
    python -m scripts.migrate_passwords            # dry-run by default
    python -m scripts.migrate_passwords --apply    # actually writes hashes

Re-running is safe: rows that already store a bcrypt hash are skipped.
"""

from __future__ import annotations

import argparse
import sys

# Make sure .env is loaded when invoked as a script.
from dotenv import load_dotenv

load_dotenv()

from app.services import sheets as users_service  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Hash legacy plaintext passwords in Sheet1.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually write the hashed passwords back to the sheet (default: dry-run).",
    )
    args = parser.parse_args()

    print(f"Mode: {'APPLY (will write)' if args.apply else 'DRY-RUN (no writes)'}")
    print("Inspecting users sheet…")

    rows = users_service.get_all_users()
    if not rows:
        print("No rows found.")
        return 0

    to_migrate: list[tuple[int, str, str]] = []
    already_hashed = 0
    header_skipped = 0

    for idx, (row_index, email, password) in enumerate(rows):
        # Heuristic: row 1 may be a header row if the email cell isn't an email
        if idx == 0 and "@" not in (email or ""):
            header_skipped += 1
            continue
        if not users_service.needs_hashing(password):
            already_hashed += 1
            continue
        to_migrate.append((row_index, email, password))

    print(f"  header rows skipped:  {header_skipped}")
    print(f"  already-hashed rows:  {already_hashed}")
    print(f"  rows needing hashing: {len(to_migrate)}")

    if not to_migrate:
        print("Nothing to do. Exiting.")
        return 0

    for row_index, email, _password in to_migrate:
        print(f"  - row {row_index}: {email}")

    if not args.apply:
        print("\nDry run complete. Re-run with --apply to write hashes.")
        return 0

    print("\nWriting hashes…")
    for row_index, email, password in to_migrate:
        new_hash = users_service.hash_password(password)
        users_service.update_password_cell(row_index, new_hash)
        print(f"  ✓ row {row_index} ({email}) hashed")

    print(f"\nDone. {len(to_migrate)} row(s) migrated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
