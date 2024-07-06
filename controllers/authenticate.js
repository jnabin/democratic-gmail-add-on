import {OAuth2Client} from 'google-auth-library';
import asyncHandler from "express-async-handler";
import "dotenv/config";

const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL;

export default asyncHandler(async (req, res, next) => {
    //console.log(SERVICE_ACCOUNT_EMAIL);
    //console.log(req);
    let event = req.body;
  let idToken = event.authorizationEventObject.systemIdToken; // Using express-bearer-token middleware
  if (!idToken){
    var err = new Error('Missing bearer token');
    err.status = 401;
    next(err);
  } 
  const audience = `${req.protocol}://${req.hostname}${req.originalUrl}`;
  const authClient = new OAuth2Client();
  const ticket = await authClient.verifyIdToken({idToken, audience});
  if (SERVICE_ACCOUNT_EMAIL && ticket.getPayload().email !== SERVICE_ACCOUNT_EMAIL) {
    var err = new Error('Invalid email');
    err.status = 503;
    next(err);
  } else {
    next(); 
  }
});