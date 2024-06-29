import {Router} from 'express'
import loginController from '../controllers/loginController.js'

const app = Router();
app.post("/checkLogin", loginController);

export default app;