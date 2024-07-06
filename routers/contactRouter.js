import{Router} from 'express'
import contactController from '../controllers/contactController.js'
import authenticate from '../controllers/authenticate.js';

const app = Router();
app.post('/selectContact', authenticate, contactController);

export default app;