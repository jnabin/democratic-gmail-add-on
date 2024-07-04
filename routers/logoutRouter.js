import {Router} from 'express'
import logoutController from '../controllers/logoutController.js'

const app = Router();
app.post("/logout", logoutController);

export default app;