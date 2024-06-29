import 'dotenv/config'
import express from 'express'; 
import homeRouter from "./routers/homeRouter.js"
import loginRouter from "./routers/loginRouter.js"
import orgRouter from "./routers/orgRouter.js"

const config = process.env;

// Create and configure the app
const app = express();

// Trust GCPs front end to for hostname/port forwarding
app.set("trust proxy", true);
app.use(express.json());

app.use(homeRouter);
app.use(loginRouter);
app.use(orgRouter);

// Start the server
const port = config.PORT || 8080;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
