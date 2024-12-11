import authService from '../services/authService.js';
import app from '../app.js';

const authController = {
signupHandler: async (req, res) => {
  const { username, password, name } = req.body;

  try {
    const result = await authService.signup(username, password, name);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    const jwtResponse = app.generateJwtTokenResponse(result.userId, username, name);
    return res.status(200).json(jwtResponse);
  } catch (error) {
    return res.status(500).json({ message: "An error occurred during signup" });
  }
},

loginHandler: async (req, res) => {
  try {
    const user = await authService.login(req.body);
    console.log('loginHandler',user);
    if (!user || !user.uid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const jwtResponse = app.generateJwtTokenResponse(
      user.uid,
      user.email,
      user.firstname
    );
    return res.status(200).json(jwtResponse);
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "An error occurred during login" });
  }
},
};

export default authController;