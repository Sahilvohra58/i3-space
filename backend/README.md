# i3 Space – Backend

Python / FastAPI backend that validates login credentials against a Google Sheet.

## Quick start

```bash
cd backend

# 1. Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env – fill in SPREADSHEET_ID and GOOGLE_API_KEY
# SPREADSHEET_ID is already pre-filled: 1XDSB_93xKEcM28GZ1ZtVUhhu6MEbouTbUIGwlOlfvHo
# Get a free API key at: https://console.cloud.google.com/apis/credentials
# (Enable "Google Sheets API" in your project first)

# 4. Run the server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Google Sheet format

| Column A (email)     | Column B (password) |
|----------------------|---------------------|
| user@example.com     | secret123           |
| admin@example.com    | adminpass           |

The service account must have **Viewer** access to the spreadsheet.
