import 'dotenv/config'
import fetch from 'node-fetch';
import {CognitoUserPool,
    CognitoUserAttribute,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserSession} from 'amazon-cognito-identity-js';
import express, { json } from 'express';
import asyncHandler from 'express-async-handler'; 
import {OAuth2Client} from 'google-auth-library';
import AWS from 'aws-sdk';
import CryptoJS from "crypto-js";

const config = process.env;

const POOL_DATA = {
	UserPoolId:config.AwsUserPoolId, // Your user pool id here
	ClientId: config.AwsClientId, // Your client id here
};
const userPool = new CognitoUserPool(POOL_DATA);

// Create and configure the app
const app = express();

let tasksList = [];

let loggedData = {};
let partiData = [];
let contacts = [];

// Trust GCPs front end to for hostname/port forwarding
app.set("trust proxy", true);
app.use(express.json());

// Initial route for the add-on
app.post(
  "/",
  asyncHandler(async (req, res) => {
    const event = req.body;
    const user = await userInfo(event);
    const tasks = await listTasks(user.sub);
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
  })
);

app.post(
  "/checkLogin",
  asyncHandler(async (req, res) => {
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
        AWS.config.region = 'ca-central-1';
        const user_pool_key =
          "cognito-idp." +
          'ca-central-1' +
          ".amazonaws.com/" +
          'ca-central-1_D8siwQ5fF';

        const login = {};
        login[user_pool_key] = result.getIdToken().getJwtToken();

        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: 'ca-central-1:9302861c-9209-40e5-ab93-2f07ff8b8b70', // your identity pool id here
          Logins: login,
        });

        (AWS.config.credentials).refresh(async error => {
            if(error) {
                console.error(error);
            } else {
                const body = {
                    email:result.getIdToken().payload.email,
                    id_token:result.getIdToken().getJwtToken(),
                    refresh_token:result.getRefreshToken().getToken(),
                    access_token:result.getAccessToken().getJwtToken(),
                };

                const response = await fetch(`${config.API_URL}/api/user/login`, {
                    method: 'post',
                    body: JSON.stringify(body),
                    headers: {'Content-Type': 'application/json', 'Authorization': CryptoJS.AES.encrypt(result.getIdToken().payload.email, config.secret_key).toString()}
                });
                const data = await response.json();
                loggedData = data.data;
                console.log(loggedData);
                let card1 = afterLoginCard(req, loggedData);
                //await filterContacts(username);
                const card = buildContactsCard(req, contacts);
                const responsePayload = {
                  renderActions: {
                    action: {
                      navigations: [
                        {
                          updateCard: card1,
                        },
                      ],
                      notification: {
                        text: "Contacts loaded.",
                      },
                    },
                  },
                };
                console.log(responsePayload);
                res.json(responsePayload);
            }
        });
      },
      onFailure(err){
        console.log(err);
      }
    });
  })
);

app.post('/selectPart', asyncHandler(async (req, res) => {
  console.log(req);
  const event = req.body;
  console.log(event);
  let data = +event.commonEventObject.formInputs.selectedOrganization.stringInputs.value;
  loggedData = JSON.parse(event.commonEventObject.parameters.logged);
  console.log(data);
  const user = userPool.getCurrentUser();
  user.getSession(async (error, session) =>{
    const response = await fetch(`${config.API_URL}/api/user/signin`, {
      method: 'post',
      body: JSON.stringify({organization_id:data}),
      headers: getAuthHeader()
    });
    console.log(response);
    let apiRes = await response.json();
    console.log(apiRes);
    if(apiRes.status == "OK"){
      loggedData = apiRes.data;
    } else {

    }
  });
}))

app.post('/fetchOrgnizations', asyncHandler(async (req, res) => {
  //getParties();
  const event = req.body;
  let data = JSON.parse(event.commonEventObject.parameters.logged);
  loggedData = data;
  const user = userPool.getCurrentUser();
  user.getSession(async (error, session) => {
    let client_id ="";
    const response = await fetch(`${config.API_URL}/api/user/organization?client_id=${client_id}`, {
      method: 'get',
      body: null,
      headers: getAuthHeader()
    });
    let data = await response.json();
    console.log(data);
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
    };
  })
  // console.log(contacts);
  // var id = req.params.obj;
  // console.log(JSON.parse(id));
  // res.json(responsePayload);
}));

app.post('/fetchContacts',   asyncHandler(async (req, res) => {
  //getParties();
  const event = req.body;
  let data = JSON.parse(event.commonEventObject.parameters.logged);
  loggedData = data;
  await filterContacts(data.user.email);
  console.log(contacts);
  var id = req.params.obj;
  console.log(JSON.parse(id));
  res.json(responsePayload);
}))

app.post(
  "/newTask",
  asyncHandler(async (req, res) => {
    const event = req.body;
    const user = await userInfo(event);

    const formInputs = event.commonEventObject.formInputs || {};
    const newTask = formInputs.newTask;
    if (!newTask || !newTask.stringInputs) {
      return {};
    }

    const task = {
      text: newTask.stringInputs.value[0],
      created: new Date(),
    };
    await addTask(user.sub, task);

    const tasks = await listTasks(user.sub);
    const card = buildCard(req, tasks);
    const responsePayload = {
      renderActions: {
        action: {
          navigations: [
            {
              updateCard: card,
            },
          ],
          notification: {
            text: "Task added.",
          },
        },
      },
    };
    res.json(responsePayload);
  })
);

app.post(
  "/complete",
  asyncHandler(async (req, res) => {
    const event = req.body;
    const user = await userInfo(event);

    const formInputs = event.commonEventObject.formInputs || {};
    const completedTasks = formInputs.completedTasks;
    if (!completedTasks || !completedTasks.stringInputs) {
      return {};
    }

    await deleteTasks(user.sub, completedTasks.stringInputs.value);

    const tasks = await listTasks(user.sub);
    const card = buildCard(req, tasks);
    const responsePayload = {
      renderActions: {
        action: {
          navigations: [
            {
              updateCard: card,
            },
          ],
          notification: {
            text: "Task completed.",
          },
        },
      },
    };
    res.json(responsePayload);
  })
);

async function userInfo(event) {
  const idToken = event.authorizationEventObject.userIdToken;
  const authClient = new OAuth2Client();
  const ticket = await authClient.verifyIdToken({
    idToken,
  });
  return ticket.getPayload();
}

async function listTasks(userId) {
  // const parentKey = datastore.key(['User', userId]);
  // const query = datastore.createQuery('Task')
  //     .hasAncestor(parentKey)
  //     .order('created')
  //     .limit(20);
  // const [tasks] = await datastore.runQuery(query);
  return tasksList;
}

async function addTask(userId, task) {
  // const key = datastore.key(['User', userId, 'Task']);
  // const entity = {
  //     key,
  //     data: task,
  // };
  // await datastore.save(entity);
  // return entity;
  let entity = {
    key: `user${userId}${tasksList.length}`,
    data: task,
  };
  tasksList.push(entity);
  console.log(tasksList);
  return entity;
}

async function deleteTasks(userId, taskIds) {
  console.log(taskIds);
  tasksList = tasksList.filter((x) => !taskIds.includes(x.key));
}

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

function afterLoginCard(req, loggedData) {
  const baseUrl = `${req.protocol}://${req.hostname}${req.baseUrl}`;
  console.log(baseUrl);
  const loginFormSection = {
    sections: [
      {
        header: "",
        widgets: [
          {
            textParagraph: {
              text: `Welcome ${loggedData.user.first_name+' '+loggedData.user.last_name}`,
            },
            horizontalAlignment: "CENTER",
          },
          {
            buttonList: {
              buttons: [
                {
                  text: "Load Organizations",
                  onClick: {
                    action: {
                      function: `${baseUrl}/fetchOrgnizations`,
                      parameters: [
                        {
                          key: "logged",
                          value: JSON.stringify(loggedData)
                        }
                      ],
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

function buildCard(req, tasks) {
  const baseUrl = `${req.protocol}://${req.hostname}${req.baseUrl}`;
  // Input for adding a new task
  const inputSection = {
    widgets: [
      {
        textInput: {
          label: "Task to add",
          name: "newTask",
          value: "",
          onChangeAction: {
            function: `${baseUrl}/newTask`,
          },
        },
      },
    ],
  };
  const taskListSection = {
    header: "Your tasks",
    widgets: [],
  };
  if (tasks && tasks.length) {
    // Create text & checkbox for each task
    console.log(tasks);
    tasks.forEach((task) =>
      taskListSection.widgets.push({
        decoratedText: {
          text: task.data.text,
          wrapText: true,
          switchControl: {
            controlType: "CHECKBOX",
            name: "completedTasks",
            value: task.key,
            selected: false,
            onChangeAction: {
              function: `${baseUrl}/complete`,
            },
          },
        },
      })
    );
  } else {
    // Placeholder for empty task list
    taskListSection.widgets.push({
      textParagraph: {
        text: "Your task list is empty.",
      },
    });
  }
  const card = {
    sections: [inputSection, taskListSection],
  };
  return card;
}

function buildContactsCard(req, contacts) {
  const baseUrl = `${req.protocol}://${req.hostname}${req.baseUrl}`;
  // Input for adding a new task
  const inputSection = {
    widgets: [
      {
        textInput: {
          label: "Task to add",
          name: "newTask",
          value: "",
          onChangeAction: {
            function: `${baseUrl}/newTask`,
          },
        },
      },
    ],
  };
  const taskListSection = {
    header: "Select the contacts",
    widgets: [],
  };
  if (contacts && contacts.length) {
    // Create text & checkbox for each task
    console.log(contacts);
    contacts.forEach((contact) =>
      taskListSection.widgets.push({
        decoratedText: {
          text: contact.first_name+' '+contact.last_name,
          wrapText: true,
          switchControl: {
            controlType: "CHECKBOX",
            name: "completedTasks",
            value: task.key,
            selected: false,
            onChangeAction: {
              function: `${baseUrl}/complete`,
            },
          },
        },
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

function buildOrgsCard(req, orgs, loggedData) {
  const baseUrl = `${req.protocol}://${req.hostname}${req.baseUrl}`;
  // Input for adding a new task
  const taskListSection = {
    header: "Select the orgs",
    widgets: [{
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
              value: JSON.stringify(loggedData)
            }
          ],
        },
      }
    }],
  };
  if (orgs && orgs.length) {
    // Create text & checkbox for each task
    //console.log(orgs);
    orgs.forEach((contact) =>
      taskListSection.widgets[0].selectionInput.items.push(
        {
          text: contact.name,
          value: contact.id,
          selected: false
        }
      )
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

function getParties(){

}

async function filterContacts(email){
  let filter = {
    "filter": [
        {
            "id": 0,
            "key": "email",
            "data": {},
            "name": "email",
            "icon": {
                "body": "<g fill=\"none\"><path d=\"M7.772 2.439l1.076-.344c1.01-.322 2.087.199 2.52 1.217l.859 2.028c.374.883.167 1.922-.514 2.568L9.819 9.706c.116 1.076.478 2.135 1.084 3.177a8.678 8.678 0 0 0 2.271 2.595l2.275-.76c.863-.287 1.802.044 2.33.821l1.233 1.81c.615.904.505 2.15-.258 2.916l-.818.821c-.814.817-1.977 1.114-3.052.778c-2.539-.792-4.873-3.143-7.003-7.053c-2.133-3.916-2.886-7.24-2.258-9.968c.264-1.148 1.081-2.063 2.149-2.404z\" fill=\"currentColor\"/></g>",
                "width": 24,
                "height": 24
            },
            "op": "=",
            "value": email,
            "between": "",
            "value_name": email,
            "names": null,
            "type": "text"
        }
    ],
    "query": "",
    "limit": 10,
    "sort": "created_date desc",
    "start": 0,
    "ticket_pipeline_id": 0,
    "surveys": null,
    "group_by": null,
    "email_campaign_id": 0,
    "assigned_type": "to_me",
    "status": "all"
  };
  console.log(getAuthHeader());
  console.log(`${config.API_URL}/api/crm/contact/filter`);
  const res = await fetch(`${config.API_URL}/api/crm/contact/filter`, {
          method: 'post',
          body: JSON.stringify(filter),
          headers: getAuthHeader()
        });
  const data =await res.json();
  console.log(res);
  if(data.status == "OK"){
    contacts = data.data.data;
    // console.log(this.contacts);
    // this.cd.detectChanges();
  }
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

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
