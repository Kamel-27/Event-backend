import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRouter from "./routes/authroutes.js";
import eventRouter from "./routes/eventRoutes.js";
import ticketRouter from "./routes/ticketRoutes.js";
import analyticsRouter from "./routes/analyticsRoutes.js";
const app = express();
const PORT = process.env.PORT || 5000;
connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // React app port
    credentials: true,
  })
);
// Routes
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/analytics", analyticsRouter);

app.get("/", (req, res) => {
  res.send("EventStudio API is running successfully!");
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
