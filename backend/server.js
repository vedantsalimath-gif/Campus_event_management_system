
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./Config/db.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import productionRoutes from "./routes/productionRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Campus Event & Production Management System API is running",
  });
});

// API routes
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/ai", aiRoutes);
app.get("/api/production-test", (req, res) => {
  res.json({ message: "Production route registration works" });
});
// Start server after connecting to MongoDB
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
