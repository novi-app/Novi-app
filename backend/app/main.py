from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers_folder import user
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
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Import and include routers_folder (will add these later)
# from app.routers_folder import user, recommendations, interventions, analytics
app.include_router(user.router)
# app.include_router(recommendations.router)
# app.include_router(interventions.router)
# app.include_router(analytics.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=True
    )
