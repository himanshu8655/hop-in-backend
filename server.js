import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import {
  findPasswordResetToken,
  login,
  markResetTokenAsUsed,
  saveForgotPasswordToken,
  signup,
  updateUserPassword,
  userExists,
} from "./db/auth.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN_ALLOWED_HOST.split(","),
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: process.env.CORS_ORIGIN_ALLOWED_HOST.split(","),
    methods: ["GET", "POST"],
  },
});

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const PORT = process.env.PORT || 3000;

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).send({ message: "Unauthorized Access" });
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(403).send({ message: "Unauthorized Access" });
  }
};

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Invalid token"));
    }
    socket.user = decoded;
    next();
  });
});

const users = new Map();

const validateAccess = async (userId, groupId) => {
  return true;
};

io.on("connection", (socket) => {
  const userId = socket.user.id;
  console.log(userId);
  users.set(userId, socket);

  console.log(`${userId} connected`);
  socket.on("join_group", async (data) => {
    const access = await validateAccess(userId, data.room_id);
    if (access) {
      socket.join(data.room_id);
    } else {
      socket.emit("unauthorized_access", { access: false });
      socket.disconnect();
    }
  });

  socket.on("message", async (data) => {
    const result = 1;
    //const result = await storeMessages(data);
    console.log(data);
    data.id = result;
    io.to(data.group).emit("message", data);
    io.to(data.group).emit("messageStatusUpdate", {
      id: data.id,
    });
  });

  socket.on("typing", ({ userId, groupId }) => {
    io.to(groupId).emit("typing", { userId: userId });
  });

  socket.on("disconnect_user", () => {
    users.delete(userId);
    console.log(`${userId} disconnect user =====`);
  });

  socket.on("disconnect", () => {
    users.delete(userId);
    console.log(`${userId} disconnected`);
  });
});

app.post("/signup", async (req, res) => {
  const { username, password, name } = req.body;

  try {
    const result = await signup(username, password, name);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    const jwtResponse = generateJwtTokenResponse(result.userId, username, name);
    return res.status(200).json(jwtResponse);
  } catch (error) {
    return res.status(500).json({ message: "An error occurred during signup" });
  }
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await userExists(email);
    if (!user) {
      return res.status(404).json({ message: "Email ID not found" });
    }

    const uuid = crypto.randomUUID();

    await saveForgotPasswordToken(email, uuid);

    return res
      .status(200)
      .json({ message: "Password reset email sent successfully." });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res
      .status(500)
      .json({ message: "An error occurred while processing your request." });
  }
});

app.post("/new-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required." });
  }

  try {
    const resetToken = await findPasswordResetToken(token);

    if (!resetToken) {
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    if (resetToken.expiry < Date.now()) {
      return res.status(400).json({ error: "Token has expired." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

      const isPasswordUpdated = await updateUserPassword(resetToken.email, hashedPassword);
      console.log(isPasswordUpdated)
    if (!isPasswordUpdated) {
      return res.status(400).json({ error: "Failed to update password." });
    }

    await markResetTokenAsUsed(token);

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error processing new password:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await login(username, password);

    if (!user || !user.userId) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const jwtResponse = generateJwtTokenResponse(
      user.userId,
      username,
      user.name
    );
    return res.status(200).json(jwtResponse);
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "An error occurred during login" });
  }
});

const generateJwtTokenResponse = (userId, userName, name) => {
  const token = jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: "1h",
  });
  const res = {
    token: token,
    userId: userId,
    name: name,
    userName: userName,
  };
  return res;
};

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
