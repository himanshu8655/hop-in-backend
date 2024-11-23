import authService from '../services/authService';
import { generateJwtTokenResponse } from '../server';


exports.signup = async (req, res) => {
  const { username, password, name } = req.body;

  try {
    const result = await authService.signup(username, password, name);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    const jwtResponse = generateJwtTokenResponse(result.userId, username, name);
    return res.status(200).json(jwtResponse);
  } catch (error) {
    return res.status(500).json({ message: "An error occurred during signup" });
  }
};

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await authService.login(username, password);

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