# AI Knowledge Inbox

Save notes and URLs, ask questions over them, get cited answers via RAG. See `SYSTEM.md`
for architecture, tradeoffs, and what breaks at scale, `TRADEOFFS.md` for a condensed
design-decisions summary, and `RAG_EXPLAINED.md` for a beginner-friendly walkthrough of
how the RAG pipeline works.

## Prerequisites

- Node.js 22+
- A running MongoDB instance (local `mongod`, Docker, or Atlas)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Setup

### 1. MongoDB

Local via Docker (skip if you already have MongoDB running somewhere and just want to point `MONGODB_URI` at it):

```bash
docker run -d --name knowledge-inbox-mongo -p 27017:27017 mongo:7
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set GEMINI_API_KEY, and MONGODB_URI if not using the default local instance
npm run dev
```

Backend listens on `http://localhost:4000`. Check `GET http://localhost:4000/health`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api/*` to the backend (see `vite.config.ts`).

## Example requests

```bash
curl -X POST http://localhost:4000/ingest \
  -H "Content-Type: application/json" \
  -d '{"type":"note","content":"Remember to review the Q3 roadmap doc before Friday."}'

curl http://localhost:4000/items

curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -d '{"question":"What do I need to do before Friday?"}'

curl -X POST http://localhost:4000/digest \
  -H "Content-Type: application/json" \
  -d '{"topic":"this week"}'
```

## Project layout

```
backend/         Express + TypeScript API, MongoDB (via Mongoose), Gemini, LangGraph
frontend/        React (function components + hooks) + Vite + TypeScript + Tailwind, feature-based structure
SYSTEM.md        Architecture, rationale, tradeoffs, what breaks at scale
TRADEOFFS.md     Condensed design-decisions doc (for review)
RAG_EXPLAINED.md Beginner-friendly walkthrough of the RAG pipeline
```
