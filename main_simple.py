from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import UPE router
from upe.routes import router as upe_router

app = FastAPI(title="YAFA UPE System", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include UPE router
app.include_router(upe_router, tags=["upe"])

# Mount UI static files
app.mount("/ui", StaticFiles(directory="ui", html=True), name="ui")

@app.get("/")
async def root():
    return {"message": "YAFA UPE System is running", "docs": "/docs", "ui": "/ui"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "YAFA UPE System"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
