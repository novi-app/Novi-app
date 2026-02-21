from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

app = FastAPI(
    title="Novi API",
    description="AI-powered solo travel decision support",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
def startup_event():
    from app.utils.firebase_client import initialize_firebase
      
    try:
        initialize_firebase()
        print("Firebase initialized successfully")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        raise


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
if settings.ENVIRONMENT == "development":
    from app.routers import debug
    app.include_router(debug.router)
    print("Debug router enabled (development mode)")

app.include_router(user.router)
