# 🖌️ Paint Store Management System

A full-stack application for managing a paint store with features for clients, products, purchases (Achats), and returns (Retours).

## 📁 Project Structure

```
project-root/
│
├── backend/                    # Express.js + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (ORM)
│   │   └── seed.js            # Database seeding script
│   │
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── routes/            # API routes
│   │   ├── middlewares/       # Authentication, error handling
│   │   ├── utils/             # Helper functions
│   │   ├── config/            # Configuration files
│   │   ├── app.js             # Express app setup
│   │
│   ├── server.js              # Server entry point
│   ├── package.json
│   └── .env                   # Environment variables (create this)
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React Context (Auth)
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API service
│   │   ├── styles/            # CSS files
│   │   ├── App.js
│   │   └── router.js          # React Router setup
│   │
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**

2. **Backend Setup**

```bash
cd backend
npm install

# Create a .env file in the backend directory
# Copy the following and update with your values:
DATABASE_URL="postgresql://user:password@localhost:5432/paintstore"
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

3. **Database Setup**

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create database tables
npx prisma migrate dev

# Seed the database with sample data
npx prisma db seed
```

4. **Frontend Setup**

```bash
cd frontend
npm install
```

5. **Run the Application**

From the root directory:

```bash
# Start both backend and frontend
npm start
```

Or run them separately:

```bash
# Backend (Terminal 1)
cd backend
npm start

# Frontend (Terminal 2)
cd frontend
npm start
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## 🔐 Default Login Credentials

After seeding the database:

**Admin:**
- Email: `admin@gmail.com`
- Password: `djalildjt`

**Staff (Gestionnaire):**
- Email: `djalil@gmail.com`
- Password: `djalildjt`

## 📚 Features

### Backend API

- **Authentication** (`/api/auth`)
  - POST `/login` - User login
  - GET `/me` - Get current user
  - PUT `/change-password` - Change password

- **Clients** (`/api/clients`)
  - GET `/` - Get all clients
  - GET `/:id` - Get client by ID
  - POST `/` - Create client
  - PUT `/:id` - Update client
  - DELETE `/:id` - Deactivate client

- **Products** (`/api/products`)
  - GET `/` - Get all products
  - GET `/:id` - Get product by ID
  - GET `/alerts/low-stock` - Get low stock products
  - POST `/` - Create product
  - PUT `/:id` - Update product
  - DELETE `/:id` - Delete product

- **Purchases** (`/api/achats`)
  - GET `/` - Get all purchases
  - GET `/:id` - Get purchase by ID
  - POST `/` - Create purchase
  - PUT `/:id/statut` - Update purchase status

- **Returns** (`/api/retours`)
  - GET `/` - Get all returns
  - GET `/:id` - Get return by ID
  - POST `/` - Create return

- **Statistics** (`/api/stats`)
  - GET `/dashboard` - Dashboard statistics
  - GET `/sales` - Sales statistics

### Frontend Pages

- **Login** - User authentication
- **Dashboard** - Overview statistics
- **Clients** - Client management
- **Products** - Product inventory
- **Achats** - Purchase management
- **Retours** - Return management

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcryptjs for password hashing

**Frontend:**
- React 19
- React Router DOM
- Axios for API calls
- Context API for state management

## 📝 Database Schema

The application uses the following main models:

- **Utilisateur** - Users (Admin, Gestionnaire)
- **Client** - Customers (Simple, Peintre)
- **Marque** - Product brands
- **Categorie** - Product categories
- **Produit** - Products with inventory tracking
- **Achat** - Purchases/Sales
- **LigneAchat** - Purchase line items
- **Retour** - Returns
- **LigneRetour** - Return line items

## 🔒 Authentication & Authorization

- JWT-based authentication
- Role-based access control (ADMIN, GESTIONNAIRE)
- Protected routes on both backend and frontend
- Token stored in localStorage

## 📦 Sample Data

The seed script creates:
- 2 Users (1 Admin, 1 Gestionnaire)
- 6 Brands (Loggia, Venixia, Pigma Color, Rolux, Casapaint, Valpaint)
- 4 Categories (peinture, accessoires, supports, outil)
- 3 Clients (1 Simple, 2 Peintres)
- 6 Products (3 paints sold by KG, 3 tools sold by PIECE)
- 1 Sample Purchase

## 🧪 API Testing

You can test the API using:

- Postman
- curl
- Frontend application

**Example API call:**

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"djalildjt"}'

# Get clients (requires token)
curl http://localhost:5000/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📄 License

ISC

