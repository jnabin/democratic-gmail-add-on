import {Router} from 'express'
import logoutController from '../controllers/logoutController.js'
import authenticate from '../controllers/authenticate.js';

const app = Router();
app.post("/logout", authenticate, logoutController);

export default app;