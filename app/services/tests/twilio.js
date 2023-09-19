const twilio = require('../twilio');
(async()=>{
    const flowId = 'FW447a46c80720031fb0e423d90c00865f';
    const options = {
        to: '+14073141901',
        from: '+18557880646',
        parameters: {
            name: 'Zeke'
        }
    }
    const data = await twilio.invokeFlow(flowId,options);
    console.log('what ',data)
})()
