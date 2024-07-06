import{Router} from 'express'
import gmailMessageController from "../controllers/gmailMessageController.js";
import authenticate from '../controllers/authenticate.js';

const app = Router();
app.post('/onGmailMessageOpen', authenticate, gmailMessageController);
export default app;