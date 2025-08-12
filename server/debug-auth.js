require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/company_management";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected successfully");

    try {
      const email = "manager@example.com";
      const password = "manager123";

      const user = await User.findOne({ email });

      if (!user) {
        console.error(`User with email ${email} not found`);
        process.exit(1);
      }

      console.log("User found:", {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash: user.password,
      });

      const directMatch = await bcrypt.compare(password, user.password);
      console.log("Direct bcrypt.compare result:", directMatch);

      const modelMatch = await user.matchPassword(password);
      console.log("Model matchPassword result:", modelMatch);

      console.log(
        "matchPassword method exists:",
        typeof user.matchPassword === "function"
      );

      if (directMatch) {
        const jwt = require("jsonwebtoken");
        if (!process.env.JWT_SECRET) {
          console.error("JWT_SECRET is missing from environment variables");
          process.exit(1);
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "30d",
        });

        console.log("JWT token can be generated:", !!token);
      }

      mongoose.disconnect();
      console.log("MongoDB disconnected");
    } catch (error) {
      console.error("Error testing authentication:", error);
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
