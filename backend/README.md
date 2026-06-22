---
title: Metis Backend
emoji: 📈
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Metis Backend API

Institutional-grade quantitative trading signal platform powered by Gemini AI.

## Endpoints

- `GET /health` — Health check
- `GET /docs` — API Documentation (Swagger UI)
- `POST /api/v1/auth/login` — User authentication
- `GET /api/v1/signals/` — Trading signals
- `GET /api/v1/strategies/` — Strategies
- `GET /api/v1/wallet/me` — Wallet info

## Tech Stack

- **FastAPI** + **Uvicorn**
- **Supabase** (Vector DB + Auth storage)
- **Google Gemini** (AI signals)
- **WebSockets** (live price feeds)
