import db from "./connection.js";
import bcrypt from "bcryptjs";

export const login = async (username, password) => {
    try {
        const user = await db.collection("users").findOne({ username });
        if (!user) {
          throw new Error("User not found");
        }
    
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }
    
        return { userId: user._id };
      } catch (err) {
        console.error("Login error:", err.message);
        return { success: false, message: err.message };
      }
  };

  export const signup = async (username, password, name) => {
    try {
      const existingUser = await db.collection("users").findOne({ username });
      if (existingUser) {
        return { success: false, message: "Username already exists" };
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const result = await db.collection("users").insertOne({
        username,
        password: hashedPassword,
        name,
      });
  
      if (!result.insertedId) {
        return { success: false, message: "Error creating user" };
      }
  
      return { success: true, userId: result.insertedId };
    } catch (err) {
      console.error("Signup error:", err.message);
      return { success: false, message: err.message };
    }
  };