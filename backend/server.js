import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import clientRoutes from "./routes/clientRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/clients", clientRoutes);


app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));