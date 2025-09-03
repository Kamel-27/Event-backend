import jwt from "jsonwebtoken";
const { verify } = jwt;

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
  },
  // Analytics fields
  age: {
    type: String,
    enum: ["18-24", "25-34", "35-44", "45+"],
    default: "25-34"
  },
  gender: {
    type: String,
    enum: ["Male", "Female"],
    default: "Male"
  },
  location: {
    type: String,
    enum: ["Cairo", "Alexandria", "Giza", "Luxor", "Aswan", "Sharm El Sheikh", "Hurghada", "International"],
    default: "Cairo"
  },
  interests: [{
    type: String,
    enum: ["Live Music", "Innovation", "EDM Music", "Food Festivals", "Technology", "Sports", "Art", "Business"]
  }],
  verifyOtp: { type: String, default: "" },
  verifyOtpExpiry: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  resetOtp: { type: String, default: "" },
  resetOtpExpiry: { type: Number, default: 0 },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
