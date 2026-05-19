# Prowider Mini Lead Distribution System

Welcome to the **Prowider Lead Distribution System**, a production-grade, highly reliable full-stack application built using Next.js (App Router, TypeScript), Prisma ORM, and PostgreSQL.

This system resolves a complex lead distribution matrix under strict constraints, handles parallel traffic spikes using pessimistic row locking (`SELECT FOR UPDATE`), enforces absolute webhook idempotency, and maintains round-robin state persistently across server restarts.

## 🚀 Live Demo & Repository
*   **Local URL**: [http://localhost:3000](http://localhost:3000)
*   **Database Host**: Supabase (PostgreSQL)

## 📁 System Architecture & Design Documents
Before diving into the code, you can inspect the in-depth staff-level engineering specifications we have written for this system:

1.  **System Topology & DB Design**: [docs/ARCHITECTURE.md](file:///c:/Users/pihup/Projects/BookmyPackers_Assignment/docs/ARCHITECTURE.md)
2.  **Persistent Round-Robin Engine**: [docs/ALGORITHM.md](file:///c:/Users/pihup/Projects/BookmyPackers_Assignment/docs/ALGORITHM.md)
3.  **Concurrency & Row-Level Locking**: [docs/CONCURRENCY.md](file:///c:/Users/pihup/Projects/BookmyPackers_Assignment/docs/CONCURRENCY.md)
4.  **HTTP Webhook Idempotency Key Design**: [docs/WEBHOOK.md](file:///c:/Users/pihup/Projects/BookmyPackers_Assignment/docs/WEBHOOK.md)

---

## 🛠️ Technology Stack
*   **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Lucide Icons
*   **Styling**: Modern Tailwind CSS v4 (Sleek Dark Theme, glowing border states, glassmorphism card styling)
*   **ORM**: Prisma Client v6
*   **Database**: PostgreSQL (Supabase)
*   **Real-time synchronization**: Server-Sent Events (SSE) via Web Streams API with a 4s periodic polling fallback for absolute connection guarantees.

---

## ⚙️ Core Feature Implementation

### 1️⃣ Customer Request Form (`/request-service`)
Allows clients to submit lead requests.
*   **Fields**: Name, Phone, City, Service Category, and Description.
*   **DB Constraint**: Enforces a strict composite `UNIQUE(phone, serviceId)` index at the PostgreSQL level. Duplicate submissions are rejected with a `409 Conflict` status message.
*   **Trigger**: Submitting successfully inserts the lead and automatically runs the distribution transaction to assign exactly 3 providers.

### 2️⃣ Provider Dashboard (`/dashboard`)
A real-time control console displaying:
*   **Quota Balances**: Visual meters of all 8 providers' remaining balances. Low balances highlight in orange/red.
*   **Lead Distribution Feed**: Most recent leads showing customer metadata and matched provider badges.
*   **Allocation Audit Trail**: Historical log of assignments with precise execution timestamps.
*   **Dynamic Updates**: Updates itself instantly without manual page refreshes when lead allocation changes occur, driven by native Server-Sent Events.

### 3️⃣ Test Tools Panel (`/test-tools`)
Simulate operational states and high-traffic workloads:
*   **Reset Provider Quotas**: Triggers a payment webhook (`POST /api/webhook/subscription`) with a unique `eventId` to reset all balances.
*   **Test Webhook Idempotency**: Dispatches 3 parallel webhook calls with the *same* `eventId`. The log will show exactly **one** processed request and **two** idempotent ignores, demonstrating zero duplicate payment resets.
*   **Generate 10 Leads Instantly**: Simulates a high-concurrency traffic spike by firing 10 parallel customer lead submissions. Uses database row locks to guarantee exact-3 assignments, rotate round-robin pointers sequentially, and protect quotas from dropping below 0.
*   **Developer DB Wipe**: Allows wiping all lead records, assignment logs, and resets provider quotas to 10 in a single transaction for clean, repeatable testing.

---

## 💻 Running the Application Locally

### Prerequisites
*   Node.js v20+ or v24+
*   NPM v10+

### Steps
1.  **Clone / Enter directory**:
    ```bash
    cd c:/Users/pihup/Projects/BookmyPackers_Assignment
    ```

2.  **Verify Environment Configuration**:
    Inspect `.env` file at the root to confirm it contains the active Supabase connection string:
    ```env
    DATABASE_URL="postgresql://postgres:Utwj_ugFFZiSg%2F3@db.qhpsgzjnkefedxthvxkr.supabase.co:5432/postgres?sslmode=require"
    ```

3.  **Synchronize Database & Generate client**:
    Ensure the tables are pushed and the Prisma client is locally generated:
    ```bash
    npx prisma db push
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

5.  **Access Web Pages**:
    *   **Homepage**: [http://localhost:3000](http://localhost:3000)
    *   **Customer Form**: [http://localhost:3000/request-service](http://localhost:3000/request-service)
    *   **Provider Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
    *   **Testing Tools**: [http://localhost:3000/test-tools](http://localhost:3000/test-tools)
