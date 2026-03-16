# 🤖 TaskFlow AI — Intelligent Task Manager

A full-stack task management app with AI-powered features: smart task prioritization, natural language task creation, deadline prediction, and productivity analytics. Built with React + FastAPI + PostgreSQL.

## Features
- **AI task creation** — describe tasks in plain English, AI extracts title, deadline, priority, tags
- **Smart prioritization** — ML model ranks tasks by urgency × importance × context
- **Deadline prediction** — estimates realistic completion time based on similar past tasks
- **Kanban + List views** with drag-and-drop
- **Recurring tasks** with natural language recurrence (e.g., "every Monday")
- **Productivity analytics** — completion rate, streak tracking, focus time
- **Team collaboration** — assign, comment, mention, share workspaces
- **REST API** + WebSocket for real-time updates

## Tech Stack
**Frontend:** React 18, TypeScript, Tailwind CSS, DnD-Kit, Recharts  
**Backend:** FastAPI, PostgreSQL, Redis, Celery  
**AI:** OpenAI GPT-4o / Anthropic Claude API  

## Quick Start
```bash
# Backend
cd backend && pip install -r requirements.txt
# create .env  file and add ANTHROPIC_API_KEY / OPENAI_API_KEY
uvicorn main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

## API Endpoints
```
POST /tasks              Create task (AI-enhanced)
GET  /tasks              List tasks with filters
PUT  /tasks/{id}         Update task
DELETE /tasks/{id}       Delete task
POST /tasks/from-text    Create task from natural language
GET  /tasks/suggestions  AI-powered next-task suggestions
GET  /analytics/summary  Productivity summary
WS   /ws                 Real-time updates
```

## License
MIT
