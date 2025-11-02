# ⚡ Quick Start Commands

## 🚨 IMPORTANT: Run These Commands First!

Before starting the application, you **MUST** install dependencies:

```bash
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies  
cd frontend
npm install
cd ..
```

## Then Setup Database

```bash
cd backend

# Create .env file with your database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/paintstore"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed
```

## Finally, Start the Application

```bash
# From root directory
npm start

# Or separately:
# Terminal 1:
cd backend && npm start

# Terminal 2:
cd frontend && npm start
```

## Common Errors

❌ **"Cannot find module 'react-router-dom'"**
✅ Solution: Run `npm install` in the frontend directory

❌ **"Cannot find module 'dotenv'"**
✅ Solution: Run `npm install` in the backend directory

❌ **"Prisma Client not found"**
✅ Solution: Run `npx prisma generate` in the backend directory

❌ **Database connection error**
✅ Solution: Check your `.env` file has correct DATABASE_URL

❌ **"POST http://localhost:5000/auth/login 404 (Not Found)"**
✅ Solution: This means the backend server isn't running. Make sure you:
   1. Created the `.env` file in backend directory
   2. Ran `npm install` in backend directory
   3. Started the backend server with `npm start`

