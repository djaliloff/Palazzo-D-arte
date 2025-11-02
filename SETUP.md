# 🚀 Quick Setup Guide

## Installation Steps

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/paintstore"
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**Important:** Replace the DATABASE_URL with your actual PostgreSQL connection string.

### 3. Setup Database

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed
```

### 4. Run the Application

**Option 1: Run from root (both at once)**
```bash
npm start
```

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
cd backend
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

### 5. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

### 6. Login Credentials

After seeding:
- **Email:** admin@gmail.com
- **Password:** djalildjt

---

## Troubleshooting

### Database Connection Issues

If you see database errors:
1. Make sure PostgreSQL is running
2. Verify your DATABASE_URL is correct
3. Create the database if it doesn't exist:
   ```sql
   CREATE DATABASE paintstore;
   ```

### Port Already in Use

If port 5000 or 3000 is in use:
1. Change the port in `.env` (backend)
2. Or stop the process using that port

### Prisma Errors

If Prisma client is not generated:
```bash
cd backend
npx prisma generate
```

### Node Version

Make sure you're using Node.js v16 or higher:
```bash
node --version
```

---

## Next Steps

1. Review the README.md for detailed API documentation
2. Explore the frontend pages
3. Test the API endpoints with Postman
4. Customize the application to your needs

---

## File Structure Overview

```
backend/src/
├── config/          # Database and environment config
├── controllers/     # Business logic
├── middlewares/     # Auth, error handling
├── routes/          # API routes
└── utils/           # Helper functions

frontend/src/
├── components/      # Reusable components
├── context/         # React Context (Auth)
├── pages/           # Page components
├── services/        # API calls
└── styles/          # CSS files
```

---

Happy coding! 🎉

