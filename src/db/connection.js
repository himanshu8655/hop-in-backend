import mongoose from 'mongoose';
import {} from 'dotenv/config';

const uri = process.env.MONGODB_URI;

try {
    await mongoose.connect(uri, {});
    console.log("Connected to MongoDB via Mongoose!");
} catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
}

const db = mongoose.connection;

export default db;