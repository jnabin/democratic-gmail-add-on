import "dotenv/config";
import fetch from "node-fetch";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";
import AWS from "aws-sdk";
import CryptoJS from "crypto-js";
import asyncHandler from 'express-async-handler'; 

const config = process.env;

const POOL_DATA = {
  UserPoolId: config.AwsUserPoolId, // Your user pool id here
  ClientId: config.AwsClientId, // Your client id here
};
const userPool = new CognitoUserPool(POOL_DATA);
let loggedData = {};

function buildOrgsCard(req, orgs, loggedData) {
  const baseUrl = `${req.protocol}://${req.hostname}${req.baseUrl}`;
  // Input for adding a new task
  const taskListSection = {
    header: "Select the orgs",
    widgets: [
      {
        selectionInput: {
          name: "selectedOrganization",
          label: "",
          type: "RADIO_BUTTON",
          items: [],
          onChangeAction: {
            function: `${baseUrl}/selectPart`,
            parameters: [
              {
                key: "logged",
                value: JSON.stringify(loggedData),
              },
            ],
          },
        },
      },
    ],
  };
  if (orgs && orgs.length) {
    // Create text & checkbox for each task
    //console.log(orgs);
    orgs.forEach((contact) =>
      taskListSection.widgets[0].selectionInput.items.push({
        text: contact.name,
        value: contact.id,
        selected: false,
      })
    );
  } else {
    // Placeholder for empty task list
    taskListSection.widgets.push({
      textParagraph: {
        text: "Contacts is empty.",
      },
    });
  }
  const card = {
    sections: [taskListSection],
  };
  return card;
}

function getAuthHeader(){
    const logged = loggedData;
    let tok= ""
    if(logged!==undefined &&  logged.token !== undefined){
      tok  = logged.token
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': tok
    }
  }

export default asyncHandler(async (req, res) => {
  const event = req.body;
  const formInputs = event.commonEventObject.formInputs || {};
  const emailField = formInputs.fieldEmail;
  const passwordField = formInputs.fieldPassword;

  if (
    !emailField ||
    !emailField.stringInputs ||
    !passwordField ||
    !passwordField.stringInputs
  ) {
    return {};
  }

  const username = emailField.stringInputs.value[0];
  const password = passwordField.stringInputs.value[0];

  const authData = {
    Username: username,
    Password: password,
  };
  const authDetails = new AuthenticationDetails(authData);
  const userData = {
    Username: username,
    Pool: userPool,
  };
  const cognitUser = new CognitoUser(userData);

  cognitUser.authenticateUser(authDetails, {
    onSuccess(result) {
      //console.log(result);
      AWS.config.region = "ca-central-1";
      const user_pool_key =
        "cognito-idp." +
        "ca-central-1" +
        ".amazonaws.com/" +
        "ca-central-1_D8siwQ5fF";

      const login = {};
      login[user_pool_key] = result.getIdToken().getJwtToken();

      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: "ca-central-1:9302861c-9209-40e5-ab93-2f07ff8b8b70", // your identity pool id here
        Logins: login,
      });

      AWS.config.credentials.refresh(async (error) => {
        if (error) {
          console.error(error);
        } else {
          const body = {
            email: result.getIdToken().payload.email,
            id_token: result.getIdToken().getJwtToken(),
            refresh_token: result.getRefreshToken().getToken(),
            access_token: result.getAccessToken().getJwtToken(),
          };

          const response = await fetch(`${config.API_URL}/api/user/login`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
              "Content-Type": "application/json",
              Authorization: CryptoJS.AES.encrypt(
                result.getIdToken().payload.email,
                config.secret_key
              ).toString(),
            },
          });
          const data = await response.json();
          loggedData = data.data;
          const user = userPool.getCurrentUser();
          user.getSession(async (error, session) => {
            let client_id = "";
            const response = await fetch(
              `${config.API_URL}/api/user/organization?client_id=${client_id}`,
              {
                method: "get",
                body: null,
                headers: getAuthHeader(),
              }
            );
            let data = await response.json();
            //console.log(data);
            if (data.status === "OK") {
              let card = buildOrgsCard(req, data.data.parties, loggedData);
              const responsePayload = {
                renderActions: {
                  action: {
                    navigations: [
                      {
                        updateCard: card,
                      },
                    ],
                    notification: {
                      text: "Organizations loaded",
                    },
                  },
                },
              };
              //console.log(responsePayload);
              res.json(responsePayload);
              // @ts-ignore
            } else {
              let card = buildOrgsCard(req, []);
              const responsePayload = {
                renderActions: {
                  action: {
                    navigations: [
                      {
                        updateCard: card,
                      },
                    ],
                    notification: {
                      text: "Organizations loaded",
                    },
                  },
                },
              };
              res.json(responsePayload);
            }
          });
        }
      });
    },
    onFailure(err) {
      console.log(err);
    },
  });
});
