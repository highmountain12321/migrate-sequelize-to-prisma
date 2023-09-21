const { wrap: async } = require('co');

const _ = require('lodash');
const {Services} = require("../services");


exports.initFlow = async function (req, res, next) {
    const {field2, field1,state, city, address,firstName, lastName, to, from='8557880646', flowId = 'FW447a46c80720031fb0e423d90c00865f'} =  req.query;
    if(!to){
        res.json({
            to,
            from,
            flowId,
            firstName,
            lastName,
            city,
            state,
            address,
            field2,
            field1,
        });
        return;
    }
    let toFiltered = to.toString().replace(/\D/g,'');
    let fromFiltered = from.toString().replace(/\D/g,'');
    const link = `https://schedule.g3.app?src=${toFiltered}`;

    const options = {
        to: `+1${toFiltered}`,
        from: `+1${fromFiltered}`,
        parameters: {
            link,
            field2,
            field1,
            state,
            city,
            address,
            firstName,
            lastName,
        }
    }
    const data = await Services.Twilio.invokeFlow(flowId,options);
    res.json(data);

}
