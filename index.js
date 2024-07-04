import 'dotenv/config'
import express from 'express'; 
import cors from 'cors';
import homeRouter from "./routers/homeRouter.js"
import contactRouter from "./routers/contactRouter.js"
import newLoginRouter from "./routers/newLoginRouter.js"
import logoutRouter from "./routers/logoutRouter.js"

const config = process.env;

global.loggedData = {};

// Create and configure the app
const app = express();

// Trust GCPs front end to for hostname/port forwarding
app.set("trust proxy", true);
app.use(express.json());

const corsOpts = {
  origin: '*',

  methods: [
    'GET',
    'POST',
  ],

  allowedHeaders: [
    'Content-Type',
  ],
};

app.use(cors(corsOpts));

app.use(homeRouter);
app.use(contactRouter);
app.use(newLoginRouter);
app.use(logoutRouter);

// Start the server
const port = config.PORT || 8080;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
