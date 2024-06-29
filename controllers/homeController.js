import asyncHandler from 'express-async-handler'; 
import {OAuth2Client} from 'google-auth-library';

export default asyncHandler(async (req, res) => {
    const event = req.body;
    const user = await userInfo(event);
    //const tasks = await listTasks(user.sub);
    const card = basicLoginCard(req);
    const responsePayload = {
      action: {
        navigations: [
          {
            pushCard: card,
          },
        ],
      },
    };
    res.json(responsePayload);
});

function basicLoginCard(req) {
    const baseUrl = `${req.protocol}://${req.hostname}${req.baseUrl}`;
    const loginFormSection = {
      sections: [
        {
          header: "",
          widgets: [
            {
              textParagraph: {
                text: "Log in to continue",
              },
              horizontalAlignment: "CENTER",
            },
            {
              textInput: {
                label: "Email",
                type: "SINGLE_LINE",
                name: "fieldEmail",
              },
            },
            {
              textInput: {
                label: "Password",
                type: "SINGLE_LINE",
                name: "fieldPassword",
              },
            },
            {
              buttonList: {
                buttons: [
                  {
                    text: "Login",
                    onClick: {
                      action: {
                        function: `${baseUrl}/checkLogin`,
                        parameters: [],
                      },
                    },
                    color: {
                      red: 0.302,
                      green: 0.945,
                      blue: 0.537,
                      alpha: 1,
                    },
                  },
                ],
              },
              horizontalAlignment: "CENTER",
            },
          ],
          collapsible: false,
        },
      ],
    };
  
    return loginFormSection;
}

async function userInfo(event) {
  const idToken = event.authorizationEventObject.userIdToken;
  const authClient = new OAuth2Client();
  const ticket = await authClient.verifyIdToken({
    idToken,
  });
  return ticket.getPayload();
}