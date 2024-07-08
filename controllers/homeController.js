import asyncHandler from 'express-async-handler'; 
import {OAuth2Client} from 'google-auth-library';
import authorizeCard from '../shared/authorizeCard.js'
import contactDetailsCard from "../shared/contactDetailsCard.js";
import fetch from "node-fetch";
import parsePhoneNumber from "../shared/parsePhoneNumber.js";
import "dotenv/config";

const config = process.env;

export default asyncHandler(async (req, res) => {
    const event = req.body;
    //console.log(global.loggedData);
    const user = await userInfo(event);
    let loggedData = global.loggedData[`${user.email}`];
    if(loggedData) {
      let contactResponses = await filterContacts(loggedData.user.email, loggedData);
      if(contactResponses.status == 401){
        delete global.loggedData[`${user.email}`];
        const responsePayload = authorizeCard();
        res.json(responsePayload);
      } else {
        let contacts = contactResponses.data;
        if(contacts && contacts.length == 1) {
          const response = await fetch(`${config.API_URL}/api/crm/contact/:${contacts[0].id}`, {
            method: "get",
            headers: getAuthHeader(loggedData),
          });
          let apiRes = await response.json();
          console.log(apiRes);
          if (apiRes.status == "OK") {
            let contact = apiRes.data;
            contact.phone_str = contact.phone ? parsePhoneNumber(contact.phone) : "";
            contact.cellphone_str = contact.cellphone
              ? parsePhoneNumber(contact.cellphone)
              : "";
            let card = contactDetailsCard(contact);
            const responsePayload = {
              action: {
                navigations: [
                  {
                    pushCard: card,
                  },
                ],
                notification: {
                  text: "Contact details loaded.",
                },
              }
            };
            res.json(responsePayload);
          } else if(apiRes.status == "ERROR" && apiRes.message == 'Invalid token') {
            const responsePayload = authorizeCard();
            res.json(responsePayload);
          } else {
            let card = contactDetailsCard(null);
            const responsePayload = {
              renderActions: {
                action: {
                  navigations: [
                    {
                      pushCard: card,
                    },
                  ],
                  notification: {
                    text: "Contact details not loaded.",
                  },
                },
              },
            };
            res.json(responsePayload);
          }
        } else {
          const card = buildContactsCard(req, contacts, loggedData);
          const responsePayload = {
            action: {
              navigations: [
                {
                  pushCard: card,
                },
              ],
              notification: {
                text: "Contacts loaded.",
              },
            },
          };
          res.json(responsePayload);
        }
      }
    } else {
      const responsePayload = authorizeCard();
      res.json(responsePayload);
    }
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
                validation: {
                  input_type: "EMAIL"
                }
              },
            },
            {
              textInput: {
                label: "Password",
                type: "SINGLE_LINE",
                name: "fieldPassword"
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


function getAuthHeader(logged){
  let tok= ""
  if(logged!==undefined &&  logged.token !== undefined){
    tok  = logged.token
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': tok
  }
}

function buildContactsCard(req, contacts, loggedData) {
  const baseUrl = `${req.protocol}://${req.hostname}${req.baseUrl}`;
  // Input for adding a new task
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

async function filterContacts(email, loggedData) {
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
  // console.log(getAuthHeader());
  // console.log(`${config.API_URL}/api/crm/contact/filter`);
  const res = await fetch(`${config.API_URL}/api/crm/contact/filter`, {
    method: "post",
    body: JSON.stringify(filter),
    headers: getAuthHeader(loggedData),
  });
  //console.log(res);
  const data = await res.json();
  if (data.status == "OK") {
   return {status: 200, data: data.data.data};
  } else if (data.status == "ERROR" && data.message == 'Invalid token'){
    return {status: 401, data: []};
  } else {
    return {status: 200, data: []};
  }
}