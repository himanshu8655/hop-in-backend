import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { login, signup } from "./db/auth.js";

dotenv.config();

const app = express();
app.use(cors());
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
    res.status(201).json(jwtResponse);
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ message: "An error occurred during signup" });
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
