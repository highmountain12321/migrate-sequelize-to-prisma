var accountSid = process.env.TWILIO_ACCOUNT_SID || "AC36db00ac515f770cfbd59ad63bc6b01d"
var authToken = process.env.TWILIO_AUTH_TOKEN || "5d6ea72ea2795d9d1d15478ed5a6c6b9";
const phoneNumber = "+18557880646";

const client = require('twilio')(accountSid, authToken, {
    lazyLoading: true
});


exports.sendSMS = async(toPhone, message) => {
    return  client.messages
        .create({body: message, from: phoneNumber, to: toPhone});

}
