import express from 'express';
import authController from '../controllers/authController.js'
const router = express.Router();

router.post('/signup',authController.signupHandler);
router.post('/login',authController.loginHandler);
router.post('/forgot-password', authController.resetPasswordHandler)

export default router;
