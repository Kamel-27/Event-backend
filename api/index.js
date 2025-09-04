import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "../config/db.js";
import authRouter from "../routes/authroutes.js";
import eventRouter from "../routes/eventRoutes.js";
import ticketRouter from "../routes/ticketRoutes.js";
import analyticsRouter from "../routes/analyticsRoutes.js";

const app = express();

// connect to MongoDB only once
if (!global.mongoose) {
  global.mongoose = connectDB();
}

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL ||
        "https://event-frontend-1g72-kmkmp2101-8836s-projects.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/analytics", analyticsRouter);

app.get("/", (req, res) => {
  res.send("EventStudio API is running successfully on Vercel!");
});

// ❌ NO app.listen() here
// ✅ Instead, export app
export default app;
