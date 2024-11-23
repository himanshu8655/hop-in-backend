import db from "./connection.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const login = async (username, password) => {
  try {
    const user = await userExists(username);
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
    const existingUser = await userExists(username);
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

export const userExists = async (email) => {
  const existingUser = await db.collection("users").findOne({username: email });
  return existingUser;
};

export const saveForgotPasswordToken = async (email, token) => {
  try {
    const expiryTime = Date.now() + 3600000;

    await db.collection("password_reset").insertOne({
      _id: token,
      email: email,
      expiry: expiryTime,
      isUsed: false,
    });
  } catch (error) {
    console.error("Error saving reset token:", error.message);

    if (error.code === 11000) {
      throw new Error("Reset token already exists");
    }

    throw new Error("Database error");
  }
};

export const findPasswordResetToken = async (token) => {
  try {
    const resetToken = await db.collection("password_reset").findOne({ _id: token });
    return resetToken;
  } catch (error) {
    console.error("Error fetching reset token:", error.message);
    throw new Error("Database error while fetching reset token.");
  }
};


export const markResetTokenAsUsed = async (token) => {
  try {
    await db.collection("password_reset").updateOne(
      { _id: token },
      { $set: { isUsed: true } }
    );
  } catch (error) {
    console.error("Error marking reset token as used:", error.message);
    throw new Error("Database error while updating reset token.");
  }
};


export const updateUserPassword = async (email, hashedPassword) => {
  try {
    const result = await db.collection("users").updateOne(
      { username: email },
      { $set: { password: hashedPassword } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error updating user password:", error.message);
    throw new Error("Database error while updating user password.");
  }
};