const { IncomingWebhook } = require('@slack/webhook');
const url = 'https://hooks.slack.com/services/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' || process.env.SLACK_WEBHOOK_URL;
const leadReturn = 'https://hooks.slack.com/services/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';
const importUrl = 'https://hooks.slack.com/services/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';


exports.send = async(payload) =>{
    let webhook = new IncomingWebhook(url);
    if(process.env.ENVIRONMENT === 'dev1'){
        return;
    }
   return  webhook.send(payload);
}
exports.returnLead = async(payload) =>{
    let webhook = new IncomingWebhook(leadReturn);
    if(process.env.ENVIRONMENT === 'dev1'){
        return;
    }
    return  webhook.send(payload);
}

exports.sendImportNotification = async(payload) =>{
    let webhook = new IncomingWebhook(importUrl);
    if(process.env.ENVIRONMENT === 'dev1'){
        return;
    }
    return  webhook.send(payload);
}
