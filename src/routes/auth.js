import express from 'express';
import authController from '../controllers/authController'
import router from Router;

router.post('/signup',authController.signup);
router.post('/login',authCOntroller.login);

module.exports = router;
