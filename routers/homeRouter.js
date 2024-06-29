import {Router} from 'express';
import homeController from '../controllers/homeController.js';

const app = Router();
app.post("/",  homeController);
export default app;