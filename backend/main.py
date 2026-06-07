"""
Main FastAPI application entry point.
"""
from __future__ import annotations
from dotenv import load_dotenv
load_dotenv()

import sys
import subprocess
import time

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.pdf import router as pdf_router
from routes.users import router as users_router
from routes.admin import router as admin_router
from routes.payments import router as payments_router
from services.db import db_manager
from constants import CORS_FRONTEND_ORIGINS, CORS_ADMIN_ORIGINS
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db_manager.connect()
    yield
    await db_manager.close()

app = FastAPI(
    title="Structured PDF Field Editor API",
    description="Backend for extracting and grouping editable fields from structured PDFs.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_FRONTEND_ORIGINS + CORS_ADMIN_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# DISABLE DATA CACHING
# ---------------------------------------------------------------------------
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(pdf_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(payments_router)



@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "pdf-field-editor-backend"}


def run_supervisor():
    args = [sys.executable] + [arg for arg in sys.argv if arg != "--worker"] + ["--worker"]
    while True:
        try:
            process = subprocess.Popen(args)
            process.wait()
            if process.returncode == 0:
                break
            else:
                time.sleep(2)
        except KeyboardInterrupt:
            try:
                process.terminate()
                process.wait(timeout=2)
            except Exception:
                pass
            break
        except Exception:
            time.sleep(2)


if __name__ == "__main__":
    if "--worker" in sys.argv:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    else:
        run_supervisor()
