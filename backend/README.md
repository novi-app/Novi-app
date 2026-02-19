# Novi Backend (FastAPI)

REST API built with FastAPI and Python.

## Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run development server
uvicorn app.main:app --reload
```

API runs at [http://localhost:8000](http://localhost:8000)

Docs at [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Structure
```
backend/
├── app/
│   ├── routers/      # API endpoints
│   ├── services/     # Business logic
│   ├── models/       # Pydantic models
│   └── utils/        # Utilities
└── scripts/          # One-time setup scripts
```

## Key Dependencies

- **FastAPI** - Modern Python web framework
- **Firebase Admin** - Firestore database
- **OpenAI** - AI/ML capabilities
- **Google Maps** - Places API

## API Endpoints

- `GET /health` - Health check
- `POST /api/user/onboard` - Create user profile
- `POST /api/recommendations` - Get venue recommendations
- `POST /api/intervention` - Generate intervention
- `POST /api/analytics/event` - Log behavioral events

Full API documentation available at `/docs` when server is running.

## Deployment

Deployed to Railway. Push to `main` branch to trigger deployment.
