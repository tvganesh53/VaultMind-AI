from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS
from routes.encryption import router as encryption_router
from routes.key_routes import router as key_router
from routes.ai_routes import router as ai_router
from routes.security import router as security_router
from database.db import db

app = FastAPI(
    title="VaultMind AI — Privacy-Preserving Security Engine",
    description="Backend cryptographic engine, Shamir secret sharing, privacy gateway, and AI isolation pipeline.",
    version="1.0.0"
)

# CORS middleware for modern frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in CORS_ORIGINS else CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(encryption_router)
app.include_router(key_router)
app.include_router(ai_router)
app.include_router(security_router)

@app.get("/health", tags=["Health"])
async def health_check():
    """System health check endpoint."""
    return {
        "status": "HEALTHY",
        "service": "VaultMind AI Privacy Gateway",
        "version": "1.0.0",
        "crypto_backend": "AES-256-GCM + Shamir(2,3) GF(p)"
    }

if __name__ == "__main__":
    import uvicorn
    from config import HOST, PORT
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
