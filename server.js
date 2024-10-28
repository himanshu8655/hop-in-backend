import express from "express";
import cors from "cors";

const PORT = process.env.PORT || 8000;
const app = express();
app.use(cors());
app.use(express.json());