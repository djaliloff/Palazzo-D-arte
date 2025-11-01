import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Get all clients
router.get("/", async (req, res) => {
  try {
    const clients = await prisma.client.findMany();
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des clients" });
  }
});

// Add new client
router.post("/", async (req, res) => {
  try {
    const { nom, prenom, email, telephone, adresse, type } = req.body;
    const client = await prisma.client.create({
      data: { nom, prenom, email, telephone, adresse, type },
    });
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'ajout du client" });
  }
});

export default router;
