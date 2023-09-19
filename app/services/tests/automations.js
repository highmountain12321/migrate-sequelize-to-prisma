const automation = require('../automation');
(async()=>{
    const contactId = 5599;
    const data = await automation.onCreateResidentialContact({id:contactId})
    console.log('what ',data)
})()
