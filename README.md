# Novi - AI Travel Companion

Novi is an AI-powered travel companion app designed to eliminate decision paralysis for solo travelers in Tokyo. It provides personalized venue recommendations and real-time interventions based on user behavior and preferences.

## Project Structure
```
novi/
├── frontend/    # Next.js PWA (deployed to Vercel)
├── backend/     # FastAPI Python (deployed to Railway)
├── shared/      # Shared configurations
└── docs/        # Technical documentation
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Firebase account
- OpenAI API key
- Google Places API key

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn app.main:app --reload
```

API runs at [http://localhost:8000](http://localhost:8000)
