import os

from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()


@app.get("/", response_class=HTMLResponse)
def root() -> str:
    return '<h1 id="probe-marker">FASTAPI_LIVE</h1>'


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True, "framework": "fastapi", "port": os.environ.get("PORT")}
