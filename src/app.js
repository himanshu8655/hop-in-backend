import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import hopinRoutes from "./routes/hopin.routes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/hopin',hopinRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

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

export const authenticateJWT = (req, res, next) => {
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

export const generateJwtTokenResponse = (userId, email, firstname) => {
    const token = jwt.sign({ id: userId }, JWT_SECRET, {
      expiresIn: "1h",
    });
    const res = {
      uid: userId,
      token: token,
      email: email,
      firstname: firstname,
    };
    return res;
};

export default app;
