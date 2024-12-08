import express from 'express';
import hopinController from '../controllers/hopinController.js';
const router = express.Router();

router.post('/carpool',hopinController.carpool);
router.post('/joincarpool',hopinController.joincarpool);

export default router;