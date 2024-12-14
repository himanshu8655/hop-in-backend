import db from "../db/connection.js"
import bcrypt from "bcryptjs";
import User from "../models/User.js"

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

  signup: async (body) => {
    try {
      console.log("email",body.email);
       const existingUser = await db.collection("users").findOne({ email: body.email });
      if (existingUser) {
        return { success: false, message: "Username already exists" };
      }
  
      const hashedPassword = await bcrypt.hash(body.password, 10);
  
      // const result = await db.collection("users").insertOne({
      //   username,
      //   password: hashedPassword,
      //   name,
      // });
     const User_new = new User({
          firstname: body.firstName,
          lastname: body.lastName,
          email: body.email,
          password: hashedPassword,
          contact_no: Number(body.contact_no),
          is_admin: 0,
      });
      const savedUser = User_new.save();
      if (!savedUser) {
        return { success: false, message: "Error creating user" };
      }
  
      return { success: true, userId: User.uid, message: "User Created" };
    } catch (err) {
      console.error("Signup error:", err.message);
      return { success: false, message: err.message };
    }
  },
  
  updatePassword: async (email, newPassword) => {
    try {
      const user = await db.collection("users").findOne({ email });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updateResult = await db.collection("users").updateOne(
        { email },
        { $set: { password: hashedPassword } }
      );

      if (updateResult.modifiedCount === 0) {
        return { success: false, message: "Failed to update password" };
      }

      return { success: true, message: "Password updated successfully" };
    } catch (err) {
      console.error("Update password error:", err.message);
      return { success: false, message: err.message };
    }
  },
};
export default authService;