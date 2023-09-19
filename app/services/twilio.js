const accountSid = 'SKdc00893c3a40c4a0cda478e69a381ffe';
const secret = 'ystCA6gglvph2KAYhh5SklOz3pgOMdv7';
const authToken = '5d6ea72ea2795d9d1d15478ed5a6c6b9';
const accountID = 'AC36db00ac515f770cfbd59ad63bc6b01d';
const client = require('twilio')(accountID, authToken);

exports.invokeFlow = async(flowId, options) => {
    /*
    {
            to: '+15558675310',
            from: '+15017122661',
            parameters: {
                name: 'Zeke'
            }
        }
     */
    return client.studio.flows(flowId)
        .executions
        .create(options);
}
