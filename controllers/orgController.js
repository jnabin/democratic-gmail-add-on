import asyncHandler from "express-async-handler";
import "dotenv/config";
import { CognitoUserPool } from "amazon-cognito-identity-js";

const config = process.env;
const POOL_DATA = {
  UserPoolId: config.AwsUserPoolId, // Your user pool id here
  ClientId: config.AwsClientId, // Your client id here
};
const userPool = new CognitoUserPool(POOL_DATA);
let loggedData = {};
let contacts = [];

console.log('sdddddd', userPool);

function buildContactsCard(req, contacts, loggedData) {
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
    widgets: [
      {
        selectionInput: {
          name: "selectedContact",
          label: "",
          type: "RADIO_BUTTON",
          items: [],
          onChangeAction: {
            function: `${baseUrl}/selectContact`,
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
  if (contacts && contacts.length) {
    // Create text & checkbox for each task
    // console.log(contacts);
    contacts.forEach((contact) =>
      taskListSection.widgets[0].selectionInput.items.push({
        text: contact.first_name + " " + contact.last_name,
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

async function filterContacts(email) {
  let filter = {
    filter: [
      {
        id: 0,
        key: "email",
        data: {},
        name: "email",
        icon: {
          body: '<g fill="none"><path d="M7.772 2.439l1.076-.344c1.01-.322 2.087.199 2.52 1.217l.859 2.028c.374.883.167 1.922-.514 2.568L9.819 9.706c.116 1.076.478 2.135 1.084 3.177a8.678 8.678 0 0 0 2.271 2.595l2.275-.76c.863-.287 1.802.044 2.33.821l1.233 1.81c.615.904.505 2.15-.258 2.916l-.818.821c-.814.817-1.977 1.114-3.052.778c-2.539-.792-4.873-3.143-7.003-7.053c-2.133-3.916-2.886-7.24-2.258-9.968c.264-1.148 1.081-2.063 2.149-2.404z" fill="currentColor"/></g>',
          width: 24,
          height: 24,
        },
        op: "=",
        value: email,
        between: "",
        value_name: email,
        names: null,
        type: "text",
      },
    ],
    query: "",
    limit: 10,
    sort: "created_date desc",
    start: 0,
    ticket_pipeline_id: 0,
    surveys: null,
    group_by: null,
    email_campaign_id: 0,
    assigned_type: "to_me",
    status: "all",
  };
  console.log(getAuthHeader());
  console.log(`${config.API_URL}/api/crm/contact/filter`);
  const res = await fetch(`${config.API_URL}/api/crm/contact/filter`, {
    method: "post",
    body: JSON.stringify(filter),
    headers: getAuthHeader(),
  });
  console.log(res);
  const data = await res.json();
  if (data.status == "OK") {
    contacts = data.data.data;
    // console.log(this.contacts);
    // this.cd.detectChanges();
  }
}

function getAuthHeader() {
  const logged = loggedData;
  let tok = "";
  if (logged !== undefined && logged.token !== undefined) {
    tok = logged.token;
  }
  return {
    "Content-Type": "application/json",
    Authorization: tok,
  };
}

export default asyncHandler(async (req, res) => {
  console.log(req);
  const event = req.body;
  console.log(event);
  let data =
    +event.commonEventObject.formInputs.selectedOrganization.stringInputs.value;
  loggedData = JSON.parse(event.commonEventObject.parameters.logged);
  console.log(data);
  const user = userPool.getCurrentUser();
  user.getSession(async (error, session) => {
    const response = await fetch(`${config.API_URL}/api/user/signin`, {
      method: "post",
      body: JSON.stringify({ organization_id: data }),
      headers: getAuthHeader(),
    });
    console.log(response);
    let apiRes = await response.json();
    console.log(apiRes);
    if (apiRes.status == "OK") {
      loggedData = apiRes.data;
      await filterContacts(loggedData.user.email);
      const card = buildContactsCard(req, contacts, loggedData);
      const responsePayload = {
        renderActions: {
          action: {
            navigations: [
              {
                updateCard: card,
              },
            ],
            notification: {
              text: "Contacts loaded.",
            },
          },
        },
      };
      res.json(responsePayload);
    } else {
    }
  });
});
