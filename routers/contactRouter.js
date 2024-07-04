import{Router} from 'express'
import contactController from '../controllers/contactController.js'

const app = Router();
app.post('/selectContact', contactController);

export default app;