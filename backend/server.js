import express from "express";
import { PrismaClient } from "@prisma/client";



const app = express();
const prisma = new PrismaClient();
app.use(express.json());

// Create user
app.post("/users", async (req, res) => {
  const { name, email} = req.body;
  const user = await prisma.user.create({ data: { name, email} });
  res.json(user);
});

// Get all users
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));