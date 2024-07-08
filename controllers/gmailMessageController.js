import "dotenv/config";
import asyncHandler from "express-async-handler";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { convert } from "html-to-text";

const gmail = google.gmail({ version: "v1" });

export default asyncHandler(async (req, res) => {
  const event = req.body;
  const currentMessageId = req.body.gmail.messageId;
  const accessToken = event.authorizationEventObject.userOAuthToken;
  const messageToken = event.gmail.accessToken;
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: accessToken });

  const gmailResponse = await gmail.users.messages.get({
    id: currentMessageId,
    userId: "me",
    auth,
    headers: { "X-Goog-Gmail-Access-Token": messageToken },
  });

  const message = gmailResponse.data;
  let messageSubject = message.payload.headers.find(
    (x) => x.name == "Subject"
  )?.value;
  let messageSender = message.payload.headers.find(
    (x) => x.name == "From"
  )?.value;
  let messageData = "";
  if (message.payload.body.data) {
    messageData = message.payload.body.data;
  } else {
    messageData = getpartWithBodyObject(message.payload.parts[0]);
  }
  let showMessage = Buffer.from(messageData, "base64").toString();
  const options = {
    ignoreHref: false,
  };
  const Rexp =
    /((http|https|ftp):\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g;
  let HTMLPartToTextPart = convert(showMessage, options);
  HTMLPartToTextPart = HTMLPartToTextPart.replace(
    Rexp,
    "<a href='$1' target='_blank'>Link to URL</a>"
  );
  let card = {
    sections: [
      {
        header: "Contact details",
        widgets: [
          {
            decoratedText: {
              text: messageSender,
              bottomLabel: "sender"
            }
          },
          {
            textParagraph: {
              text: `<b>${messageSubject}</b>`,
            },
          },
          {
            textParagraph: {
              text: HTMLPartToTextPart,
            },
          },
        ],
      },
    ],
  };
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
    },
  };
  //const response = null;
  res.json(responsePayload);
});

function getpartWithBodyObject(part) {
  if (part.body.data) {
    return part.body.data;
  } else {
    for (let i = 0; i < part.parts.length; i++) {
      if (part.parts[i].body.data) {
        return part.parts[i].body.data;
      } else if (i == part.parts.length - 1) {
        getpartWithBodyObject(part.parts[0].parts);
      }
    }
  }
}
