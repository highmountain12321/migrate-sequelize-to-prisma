const {default: axios} = require("axios");
const endpoint = 'https://floating-island-27571.herokuapp.com/benepath';

exports.return = async(email, comment) =>{
    if(process.env.ENVIRONMENT === 'dev1'){
        return;
    }
    return axios.get(endpoint,{params:{
        comment,
            email
        }});

}
