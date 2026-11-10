# Ware Store ("Where Trust Builds")
### Multi-Tenant B2B Construction Marketplace

Ware Store is a responsive, full-stack B2B marketplace bridging **Construction Builders (Buyers)** and **Material Vendors (Sellers)** with geospatial demand matching powered by **PostGIS**, dual-factor verification via **Redis**, dynamic cascading material wizards, and competitive live quote leaderboards.

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React Icons.
- **Backend:** Node.js, Express, TypeScript, `pg` with spatial PostGIS geometry queries, `ioredis` for OTP rate limiting & token blacklisting.
- **Database:** PostgreSQL 16 with the **PostGIS 3.4** extension enabled (`GEOGRAPHY(Point, 4326)`), spatial `GIST` indexing.
- **Cache / Security:** Redis 7 for OTP storage (5-min expiration, 3 attempts max before 15-min cooldown), JWT access & httpOnly refresh tokens.
- **Containerization:** Docker Compose running PostgreSQL + PostGIS on `5432` and Redis on `6379`.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js >= 18
- Docker Desktop (running)

### 2. Start PostgreSQL with PostGIS & Redis
```bash
docker compose up -d
```

### 3. Install Dependencies
```bash
# In the root repository
npm install
```

### 4. Run PostGIS Migrations & Database Seeding
```bash
npm run seed
```
This sets up PostGIS extensions, creates all tables with `GIST` indexes, and seeds verified metro builders, vendors, and competing quotations across Bengaluru.

### 5. Launch Development Servers
```bash
# Start both Backend (Port 5001) and Frontend (Port 3000) concurrently:
npm run dev
```
- **Web App:** [http://localhost:3000](http://localhost:3000)
- **API Health Check:** [http://localhost:5001/api/health](http://localhost:5001/api/health)
- **REST Endpoints Base:** [http://localhost:5001/api/v1](http://localhost:5001/api/v1)

---

## 🧪 Verification & Automated Tests

Run the PostGIS spatial calculations test suite:
```bash
npm run test:spatial
```
*Validates geodesic `ST_Distance` calculations between Whitefield and Marathahalli (~5.5 km) and tests `ST_DWithin` radius filtering at 5 km vs 10 km.*

Run the End-to-End API integration test suite:
```bash
npm run test:api
```
*Tests Redis OTP generation, cooldown enforcement, Builder & Vendor KYC verification with PAN/GSTIN validation, Requisition Wizard, PostGIS Feed discovery, and Quote Acceptance.*

---

## 🔑 Demo Test Personas (Pre-Seeded)

The web application includes a 1-click **Demo Switcher** in the top navigation bar:
- **Rajesh Kumar (Builder)**: Phone `9876543210` • Prestige Tech Cloud Site, Whitefield, Bengaluru
- **Mahaveer Building Materials (Vendor)**: Phone `9900112233` • Marathahalli Depot (5.5 km from Whitefield)
- **Apex Aggregates (Vendor)**: Phone `9922334455` • Hoskote Corridor (18 km from Whitefield)
- **Ananya Sharma (Builder)**: Phone `9811223344` • Sobha Silicon Oasis, Electronic City Phase 1
