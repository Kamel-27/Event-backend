import express from "express";
import { register, login, logout, getProfile, updateProfile } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.post("/logout", logout);
authRouter.get("/profile", verifyToken, getProfile);
authRouter.put("/update-profile", verifyToken, updateProfile);

export default authRouter;
