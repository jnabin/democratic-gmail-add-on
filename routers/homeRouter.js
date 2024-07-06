import {Router} from 'express';
import homeController from '../controllers/homeController.js';
import authenticate from '../controllers/authenticate.js';

const app = Router();
app.post("/", authenticate,  homeController);
export default app;