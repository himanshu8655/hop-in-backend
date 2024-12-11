import db from "../db/connection.js"
import bcrypt from "bcryptjs";

const authService = {
  login: async (body) => {
    try {
        const user = await db.collection("users").findOne({ email: body.email });
        if (!user) {
          throw new Error("User not found");
        }
        // const hashedPassword = await bcrypt.hash(body.password, 10);
        // console.log('login',hashedPassword,user.password);
        const isPasswordValid = await bcrypt.compare(body.password, user.password);
        console.log("isPasswordValid",isPasswordValid);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }
    
        return user;
      } catch (err) {
        console.error("Login error:", err.message);
        return { success: false, message: err.message };
      }
  },

  signup: async (username, password, name) => {
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
  },
};

export default authService;