import {Router} from 'express'
import newLoginController from '../controllers/newLoginController.js'

const app = Router();
app.post("/newLogin", newLoginController);

export default app;