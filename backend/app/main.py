from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="Novi API",
    description="AI-powered solo travel decision support",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event - Initialize Firebase
@app.on_event("startup")
def startup_event():
    """
    Initialize services when FastAPI starts
    """
    from app.utils.firebase_client import initialize_firebase
    
    try:
        initialize_firebase()
        print("Firebase initialized successfully")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        raise  # Fail fast - don't start if Firebase is broken

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "novi-api",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Novi API",
        "docs": "/docs",
        "health": "/health"
    }

# Include debug router ONLY in development
if os.getenv("ENVIRONMENT") == "development":
    from app.routers import debug
    app.include_router(debug.router)
    print("Debug router enabled (development mode)")

# Include other routers as they're built
# from app.routers import user, recommendations, interventions, analytics
# app.include_router(user.router)
# app.include_router(recommendations.router)
# etc.
