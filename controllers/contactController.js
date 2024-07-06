import asyncHandler from "express-async-handler";
import authorizeCard from '../shared/authorizeCard.js'
import contactDetailsCard from "../shared/contactDetailsCard.js";
import parsePhoneNumber from "../shared/parsePhoneNumber.js";
import fetch from "node-fetch";
import "dotenv/config";

const config = process.env;
let loggedData = {};
export default asyncHandler(async (req, res) => {
  const event = req.body;
  let data =
    +event.commonEventObject.formInputs.selectedContact.stringInputs.value;
  loggedData = JSON.parse(event.commonEventObject.parameters.logged);
  const response = await fetch(`${config.API_URL}/api/crm/contact/:${data}`, {
    method: "get",
    headers: getAuthHeader(),
  });
  let apiRes = await response.json();
  if (apiRes.status == "OK") {
    let contact = apiRes.data;
    contact.phone_str = contact.phone ? parsePhoneNumber(contact.phone) : "";
    contact.cellphone_str = contact.cellphone
      ? parsePhoneNumber(contact.cellphone)
      : "";
    let card = contactDetailsCard(contact);
    const responsePayload = {
      renderActions: {
        action: {
          navigations: [
            {
              updateCard: card,
            },
          ],
          notification: {
            text: "Contact details loaded.",
          },
        },
      },
    };
    res.json(responsePayload);
  } else if(apiRes.status == "ERROR" && data.message == 'Invalid token') {
    const responsePayload = authorizeCard();
    res.json(responsePayload);
  } else {
    let card = contactDetailsCard(null);
    const responsePayload = {
      renderActions: {
        action: {
          navigations: [
            {
              updateCard: card,
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
});

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



function hexToRgb(hex){
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    red: parseInt(result[1], 16),
    green: parseInt(result[2], 16),
    blue: parseInt(result[3], 16),
    alpha: 1
  } : null;
}
