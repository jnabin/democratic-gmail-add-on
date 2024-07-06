export default function contactDetailsCard(contact) {
    if(contact){
      let addressValue = contact.address ? `${contact.address},` : "";
      addressValue += contact.city ? `${contact.city},` : "";
      addressValue += contact.state;
      const card = {
        header: {
          title: `${contact.full_name}`,
          subtitle: addressValue,
          imageUrl: contact.profile_image
            ? contact.profile_image
            : "https://ci5.googleusercontent.com/proxy/PyJtAvX2HSt_5SAv7kNBCjcR-Bs7YUgHwfm_dbh7s1gP2wqT92jr4VVz7mtHcYjetpXQDFImx00qaZ5Ic8fY__SN7Qri46Ip4c6Etcxt08uYfMpHo5W5_1ki2Li0S69Ua35KFPdxf8SNU95cHB9XTcsp8vlWyUTF5tOgkD0D6zf0Qd4sXUYSc3pxiASKLeSaRF66T3KsxUcyvPg710nGf4zMRB6SGfMDQs3ycqc=s64-c",
          imageType: "SQUARE",
          imageAltText: `Avatar for ${contact.full_name}.`,
        },
        sections: [
          {
            header: "Tags Info",
            collapsible: true,
            uncollapsibleWidgetsCount: 1,
            widgets: [],
          },
          {
            header: "Contact Info",
            collapsible: true,
            uncollapsibleWidgetsCount: 1,
            widgets: [
              {
                decoratedText: {
                  text: contact.phone_str,
                  topLabel: "Phone",
                  startIcon: {
                    knownIcon: "PHONE",
                  },
                },
              },
              {
                decoratedText: {
                  text: contact.cellphone_str,
                  topLabel: "Cellphone",
                  startIcon: {
                    knownIcon: "PHONE",
                  },
                },
              },
              {
                decoratedText: {
                  text: contact.email,
                  topLabel: "Email",
                  startIcon: {
                    knownIcon: "EMAIL",
                  },
                },
              },
              {
                decoratedText: {
                  text: contact.email2,
                  topLabel: "Email secondary",
                  startIcon: {
                    knownIcon: "EMAIL",
                  },
                },
              },
            ],
          },
          {
            header: "Related Organizations",
            collapsible: true,
            uncollapsibleWidgetsCount: 1,
            widgets: [],
          },
          {
            header: "Assigned Tickets",
            collapsible: true,
            uncollapsibleWidgetsCount: 1,
            widgets: [],
          },
        ],
      };
    
      if(contact.tag && contact.tag.length > 0){
        card.sections[0].widgets.push({
    
          buttonList: {
            buttons: contact.tag.map(x => {
              let obj = {text: x.name};
              if(x.color) {
                let cRgb = hexToRgb(x.color);
                obj.color = cRgb;
              }
    
              return obj;
            })
          }
        });
      } else {
        card.sections[0].widgets.push({
          decoratedText: {
            text: "",
          }
        });
      }
    
      if (contact.organizations && contact.organizations.length > 0) {
        contact.organizations.forEach((element) => {
          let iconObj = {};
          if (element.profile_image) {
            iconObj = { icon: element.profile_image };
          } else {
            iconObj = { knownIcon: "MULTIPLE_PEOPLE" };
          }
          card.sections[2].widgets.push({
            decoratedText: {
              text: element.name,
              bottomLabel: element.relation,
              startIcon: iconObj,
              onClick: {
                openLink: {
                  url: `https://crm.democratik.org/admin/crm/organizations/list/:${element.id}`,
                },
              },
            },
          });
        });
      } else {
        card.sections[2].widgets.push({
          decoratedText: {
            text: "",
          },
        });
      }
    
      if (contact.ticket && contact.ticket.length > 0) {
        contact.ticket.forEach((element) => {
          card.sections[3].widgets.push({
            decoratedText: {
              text: element.name,
              startIcon: {
                knownIcon: "TICKET"
              },
              onClick: {
                openLink: {
                  url: `https://crm.democratik.org/admin/crm/tickets/board/:${element.id}`,
                },
              },
            },
          });
        });
      } else {
        card.sections[3].widgets.push({
          decoratedText: {
            text: "",
          },
        });
      }
      return card;
    } else {
      const taskListSection = {
        header: "Contact details not found",
        widgets: [
          {
            textParagraph: {
              text: "Something went wrong.",
            },
          }
        ],
      };
      return taskListSection;
    }
  }