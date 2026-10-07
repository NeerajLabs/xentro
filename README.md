# Xentro — Full-Stack Platform

> Connect People. Create Opportunity.

This repository is a monorepo containing the complete Xentro platform, including the Next.js frontend and Django modular monolith backend.

---

## 📁 Repository Structure

```
.
├── NewPro/             # Frontend application (Next.js 14, React 18, Tailwind CSS)
├── xentro_backend/     # Backend service (Django 5, Channels, DRF, MongoDB Atlas)
└── .gitignore          # Monorepo git ignore rules
```

---

## 🚀 Quick Start

### 1. Backend (`xentro_backend`)

The backend is built with Django REST Framework and Django Channels, with MongoDB Atlas as the primary database.

```bash
cd xentro_backend

# 1. Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
# Copy .env.example to .env and configure your MongoDB, Redis, and Zoho SMTP keys
cp .env.example .env

# 4. Start the backend server
python manage.py runserver 8000
```

The API will be available at `http://localhost:8000/`.

---

### 2. Frontend (`NewPro`)

The frontend is a modern Next.js 14 web application.

```bash
cd NewPro

# 1. Install dependencies
npm install

# 2. Configure environment variables
# Copy .env.local.example to .env.local
cp .env.local.example .env.local

# 3. Run the development server
npm run dev
```

The frontend will be running at `http://localhost:3000/`.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Lucide Icons, TypeScript
- **Backend**: Django 5.x, Django REST Framework, Django Channels (WebSockets), Daphne
- **Database**: MongoDB Atlas (via `pymongo`)
- **Cache & Realtime**: Redis (Channel layer & Cache)
- **Object Storage**: Cloudflare R2
- **Auth**: JWT Bearer & HttpOnly Cookies
