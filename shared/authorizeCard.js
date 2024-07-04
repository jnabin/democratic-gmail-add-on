export default function authorizeCard(){
    const card = 
    {
      custom_authorization_prompt: {
        action: {
          navigations: [
            {
              pushCard: {
                sections: [
                  {
                    widgets: [
                      {
                        image: {
                          imageUrl: "https://crm.democratik.org/assets/img/logo@2x.png",
                          altText: "Democratik logo"
                        }
                      },
                      {
                        divider: {}
                      },
                      {
                        textParagraph: {
                          text: "Login to get started"
                        }
                      },
                      {
                        buttonList: {
                          buttons: [
                            {
                              text: "Login",
                              onClick: {
                                openLink: {
                                  url: "https://crm.democratik.org/signin",
                                  onClose: "RELOAD",
                                  openAs: "OVERLAY"
                                }
                              },
                              color: {
                                red: 0.302,
                                green: 0.945,
                                blue: 0.537,
                                alpha: 1,
                              }
                            }
                          ]
                        }
                      },
                      {
                        textParagraph: {
                          text: "You do not have a Democratik account? <a href=\"https://crm.democratik.org/signin/signup\">Create an account</a>"
                        }
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      }
    }
  
    return card;
  }
  