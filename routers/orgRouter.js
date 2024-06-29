import {Router} from 'express'
import orgController from '../controllers/orgController.js'

const app = Router();
app.post('/selectPart', orgController);

export default app;