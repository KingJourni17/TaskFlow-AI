"""TaskFlow AI — FastAPI backend"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import uuid

app = FastAPI(title="TaskFlow AI", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

tasks_db: dict = {}
ws_connections: list = []

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: Optional[str] = "medium"
    due_date: Optional[date] = None
    tags: Optional[List[str]] = []

PRIORITY_KEYWORDS = {
    "critical": ["urgent","asap","critical","emergency"],
    "high": ["important","today","priority","soon"],
    "low": ["sometime","eventually","no rush"],
}

def parse_nl_task(text: str) -> dict:
    lower = text.lower()
    priority = "medium"
    for p, words in PRIORITY_KEYWORDS.items():
        if any(w in lower for w in words):
            priority = p; break
    title = text.split(".")[0].strip()[:60]
    tags = [w[1:] for w in text.split() if w.startswith("#")]
    return {"title": title, "priority": priority, "tags": tags, "description": text}

def ai_score(task: dict) -> float:
    base = {"critical":0.95,"high":0.75,"medium":0.5,"low":0.2}.get(task.get("priority","medium"),0.5)
    return round(base, 3)

@app.get("/")
def root(): return {"name": "TaskFlow AI", "docs": "/docs"}

@app.post("/tasks", status_code=201)
async def create_task(payload: TaskCreate):
    tid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    task = {**payload.model_dump(), "id": tid, "status": "todo",
            "ai_priority_score": ai_score(payload.model_dump()),
            "created_at": now, "updated_at": now}
    tasks_db[tid] = task
    return task

@app.get("/tasks")
def list_tasks(status: Optional[str] = None):
    items = list(tasks_db.values())
    if status: items = [t for t in items if t["status"] == status]
    items.sort(key=lambda t: t.get("ai_priority_score", 0), reverse=True)
    return {"tasks": items, "total": len(items)}

@app.put("/tasks/{task_id}")
async def update_task(task_id: str, payload: dict):
    t = tasks_db.get(task_id)
    if not t: raise HTTPException(404, "Task not found")
    t.update(payload); t["updated_at"] = datetime.utcnow().isoformat()
    return t

@app.delete("/tasks/{task_id}", status_code=204)
async def delete_task(task_id: str):
    if task_id not in tasks_db: raise HTTPException(404)
    del tasks_db[task_id]

class NLTaskRequest(BaseModel):
    text: str

@app.post("/tasks/from-text")
async def task_from_text(req: NLTaskRequest):
    parsed = parse_nl_task(req.text)
    tc = TaskCreate(title=parsed["title"], priority=parsed["priority"],
                    tags=parsed["tags"], description=parsed["description"])
    return await create_task(tc)

@app.get("/analytics/summary")
def analytics():
    total = len(tasks_db)
    done = sum(1 for t in tasks_db.values() if t["status"] == "done")
    return {"total": total, "completed": done,
            "completion_rate": round(done/total*100,1) if total else 0}

@app.get("/health")
def health(): return {"status": "ok"}
