const {default: axios} = require("axios");
const _ = require('lodash');
const moment = require("moment");
exports.getIncentives = async(stateAbbr) =>{
    const {data} =  await axios.get('https://phx.gosolo.io/api/v1/incentives?staging=false&limit=10000');
    if(data){
        const federalArray = data.results.filter(a => a.type).filter(a => a.type.toLowerCase() === 'federal' && a.country==='USA' &&

            !moment(a.expiration).isBefore(moment(), "day"));

        const stateArray = data.results.filter(a => a.state_code).filter(a => a.state_code.toLowerCase() === stateAbbr.toLowerCase());
        const notExpired = stateArray.filter(a=> a.expiration && !moment(a.expiration).isBefore(moment(), "day"));
        const indefinit = stateArray.filter(a=> !a.expiration);
        const all = [...indefinit,...notExpired]

        const grouped = _.groupBy(all, function(entry) {
            return entry.type;
        });

        return {state:grouped, federal:federalArray};
    }
    return false;
}
exports.getStateObject = async(stateAbbr) =>{
    const {data} =  await axios.get('https://programs.dsireusa.org/api/v1/states?orderBy=name&orderDir=ASC&limit=100');
    if(data && data.data){

        const obj = data.data.find(a => a.abbreviation.toLowerCase() === stateAbbr.toLowerCase());


        return obj;
    }
    return false;
}
exports.returnLead = async(payload) =>{

}
