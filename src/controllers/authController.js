import authService from '../services/authService.js';
import app, {generateJwtTokenResponse} from '../app.js';

const authController = {
signupHandler: async (req, res) => {
  try {
    const result = await authService.signup(req.body);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // const jwtResponse = app.generateJwtTokenResponse(result.userId, username, name);
    return res.status(200).json({message: result.message});
  } catch (error) {
    return res.status(500).json({ message: "An error occurred during signup" });
  }
},

loginHandler: async (req, res) => {

  try {
    const user = await authService.login(req.body);

    if (!user || !user.uid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const jwtResponse = generateJwtTokenResponse(
      user.uid,
      req.body.email,
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