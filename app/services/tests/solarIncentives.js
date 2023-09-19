const solarIncentives = require('../solarIncentives');
(async()=>{
    const data = await solarIncentives.getIncentives('fl');
    console.log('what ',data)
})()
