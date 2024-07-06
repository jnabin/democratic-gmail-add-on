export default function parsePhoneNumber(phoneNumber, show_if_wrong = false) {
    let parsedNumber;
    if (phoneNumber != "") {
      //Main contact phone
      try {
        const phone_parts = phoneNumber.split(";");
        const parsed = parsePhoneNumber(phone_parts[0] + phone_parts[1]);
        phone_parts[2] ? (parsed.ext = phone_parts[2]) : "";
        parsedNumber =
          "+" + (parsed.countryCallingCode || "") + " " + parsed.formatNational();
      } catch (e) {
        parsedNumber = phoneNumber ? phoneNumber.replace(/;/g, " ") : "";
      }
    } else {
      parsedNumber = "";
    }
  
    return parsedNumber;
  }