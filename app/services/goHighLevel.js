const {default: axios} = require("axios");
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6InVVajJnaVNsMTMya0hIbTliM3pUIiwiY29tcGFueV9pZCI6ImthbTZDRkZndUczTHE1VThFQlgxIiwidmVyc2lvbiI6MSwiaWF0IjoxNjkxMTU5MDE4NTIxLCJzdWIiOiJ1c2VyX2lkIn0.82qdGLvVOPhjVCAq50dNrzGSF02AjmelhbPCxc5FYyQ';

exports.createContact = async(contactObject, tags = []) =>{

    const ghlObject = {
        firstName:contactObject.firstName,
        lastName:contactObject.lastName,
        email: contactObject.email,
        phone: contactObject.primaryPhone,
        city: contactObject.city,
        state: contactObject.state,
        postalCode: contactObject.postalCode,
        tags
    }
    Object.keys(ghlObject).forEach((key)=>{
        if(ghlObject[key] === ''){
            delete ghlObject[key];
        }
    });
    ghlObject.tags.push('G3CRM');

    const config = {
        method: 'post',
        url: 'https://rest.gohighlevel.com/v1/contacts/',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        data : ghlObject
    };

    return axios(config);

}
