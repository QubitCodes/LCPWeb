# LMS Workforce Certification Platform

A comprehensive Learning Management System (LMS) designed for certifying the workforce (Laborers, Masons, etc.) through Company Partners and Supervisors. Built with **Next.js 14 (App Router)**, **TypeScript**, **Material UI**, and **PostgreSQL (Sequelize ORM)**.

## 🚀 Key Features

*   **Role-Based Access Control**: Super Admin, Admin, Supervisor, and Worker roles.
*   **Company Management**: Onboard partner companies and their supervisors.
*   **Course Progression**: Level-based learning (1-4) with video content and mandatory questionnaires.
*   **Strict Logic**: 
    *   90% video watch requirement.
    *   Experience-based fast-tracking for Level 2.
    *   2-year mandatory waiting period between levels.
    *   "3 Strikes" rule for final exams (fails level).
*   **Financials**: Order creation, manual/Stripe payment simulation, and enrollment activation.
*   **Audit Logging**: Tracks critical actions for compliance.
*   **Certificate Generation**: Printable certificates upon course completion.

## 🛠️ Tech Stack

*   **Frontend**: React, Next.js 14 (App Router), Material UI (MUI v5).
*   **Backend**: Next.js API Routes (Serverless functions).
*   **Database**: PostgreSQL (Default) or MySQL.
*   **ORM**: Sequelize (TypeScript).
*   **Validation**: Zod.
*   **Auth**: JWT (Stateless).
*   **Docs**: Swagger UI.

## ⚙️ Setup & Installation

### 1. Prerequisites
*   Node.js (v18+)
*   Database (PostgreSQL or MySQL) running locally or in the cloud.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```
Update the `.env` file with your credentials.

### 4. Database Setup

#### Option A: PostgreSQL (Default)
1.  Ensure `DB_DIALECT=postgres` in `.env`.
2.  Ensure `DB_PORT=5432`.
3.  **Development**: Run `npm run db:migrate` (if migrations exist) or use the API seeder.
4.  **Production**: See deployment section below.

#### Option B: MySQL
1.  Install the MySQL driver:
    ```bash
    npm install mysql2
    ```
2.  Update `.env`:
    ```env
    DB_DIALECT=mysql
    DB_PORT=3306
    ```

## 📦 Deployment & First Run (Production)

Since this is a Next.js App Router project using TypeScript models, standard CLI migrations may not run easily in a production environment (without `ts-node`). We use an API-based initialization.

### Step 1: Build & Start
```bash
npm install --production
npm run build
npm start
```

### Step 2: Initialize Database (Create Tables & Seed Data)
Once the server is running (e.g., on port 3000), you must trigger the system seed endpoint. This will check your models and create the necessary tables in your MySQL/Postgres database.

Run this command from your terminal:
```bash
curl -X POST http://localhost:3000/api/v1/system/seed
```

You should see a response:
```json
{ "status": true, "message": "Database Seeded Successfully", "code": 100 }
```

### Step 3: Login
You can now log in with the default Super Admin credentials:
*   **URL**: `http://your-domain/login`
*   **Email**: `admin@lms.com`
*   **Password**: `password123`

## 📖 API Documentation

The application includes auto-generated Swagger documentation.
Once the server is running, visit:

**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

## 📂 Project Structure

*   `src/app`: Next.js App Router pages and API routes.
    *   `src/app/api`: Backend logic entry points.
    *   `src/app/dashboard`: Protected UI routes.
*   `src/controllers`: Business logic and database interactions (MVC Pattern).
*   `src/models`: Sequelize definitions.
*   `src/lib`: Utilities (Auth, Database connection).
*   `src/services`: Helper services (Audit, Storage).
