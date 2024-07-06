import {Router} from 'express'
import newLoginController from '../controllers/newLoginController.js'
import authenticate from '../controllers/authenticate.js';

const app = Router();
app.post("/newLogin", authenticate, newLoginController);

export default app;