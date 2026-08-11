import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api import (
    actions,
    assistant,
    audits,
    auth,
    categories,
    comments,
    departments,
    documents,
    findings,
    history,
    notifications,
    permissions,
    projects,
    reports,
    risks,
    stats,
    templates,
    uploads,
    users,
)
from .config import settings

app = FastAPI(title="Compliance Audit System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Assure l'existence du dossier d'uploads (le système de fichiers cloud est vierge au démarrage).
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(departments.router, prefix=api_prefix)
app.include_router(templates.router, prefix=api_prefix)
app.include_router(audits.router, prefix=api_prefix)
app.include_router(findings.router, prefix=api_prefix)
app.include_router(actions.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(uploads.router, prefix=api_prefix)
app.include_router(projects.router, prefix=api_prefix)
app.include_router(documents.router, prefix=api_prefix)
app.include_router(risks.router, prefix=api_prefix)
app.include_router(categories.router, prefix=api_prefix)
app.include_router(comments.router, prefix=api_prefix)
app.include_router(history.router, prefix=api_prefix)
app.include_router(permissions.router, prefix=api_prefix)
app.include_router(stats.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(assistant.router, prefix=api_prefix)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
