const casual = require('casual');


function abbrState(input, to){

    var states = [
        ['Arizona', 'AZ'],
        ['Alabama', 'AL'],
        ['Alaska', 'AK'],
        ['Arkansas', 'AR'],
        ['California', 'CA'],
        ['Colorado', 'CO'],
        ['Connecticut', 'CT'],
        ['Delaware', 'DE'],
        ['Florida', 'FL'],
        ['Georgia', 'GA'],
        ['Hawaii', 'HI'],
        ['Idaho', 'ID'],
        ['Illinois', 'IL'],
        ['Indiana', 'IN'],
        ['Iowa', 'IA'],
        ['Kansas', 'KS'],
        ['Kentucky', 'KY'],
        ['Louisiana', 'LA'],
        ['Maine', 'ME'],
        ['Maryland', 'MD'],
        ['Massachusetts', 'MA'],
        ['Michigan', 'MI'],
        ['Minnesota', 'MN'],
        ['Mississippi', 'MS'],
        ['Missouri', 'MO'],
        ['Montana', 'MT'],
        ['Nebraska', 'NE'],
        ['Nevada', 'NV'],
        ['New Hampshire', 'NH'],
        ['New Jersey', 'NJ'],
        ['New Mexico', 'NM'],
        ['New York', 'NY'],
        ['North Carolina', 'NC'],
        ['North Dakota', 'ND'],
        ['Ohio', 'OH'],
        ['Oklahoma', 'OK'],
        ['Oregon', 'OR'],
        ['Pennsylvania', 'PA'],
        ['Rhode Island', 'RI'],
        ['South Carolina', 'SC'],
        ['South Dakota', 'SD'],
        ['Tennessee', 'TN'],
        ['Texas', 'TX'],
        ['Utah', 'UT'],
        ['Vermont', 'VT'],
        ['Virginia', 'VA'],
        ['Washington', 'WA'],
        ['West Virginia', 'WV'],
        ['Wisconsin', 'WI'],
        ['Wyoming', 'WY'],
        ['Puerto Rico','PR']
    ];

    if (to == 'abbr'){
        input = input.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        for(i = 0; i < states.length; i++){
            if(states[i][0] == input){
                return(states[i][1]);
            }
        }
    } else if (to == 'name'){
        input = input.toUpperCase();
        for(i = 0; i < states.length; i++){
            if(states[i][1] == input){
                return(states[i][0]);
            }
        }
    }
}


module.exports = {
    up: async (queryInterface, Sequelize) => {
        const partnerStates = [
            {
                "States": "Florida"
            },
            {
                "States": "Arkansas|Missouri|Oklahoma"
            },
            {
                "States": "California|Connecticut|Illinois|Massachusetts|New Hampshire|New Jersey|Puerto Rico|Rhode Island|Utah|California|Oregon|Utah|Nevada|Arizona|New Mexico|Texas|Colorado|Minnesota|Wisconsin|Massachusetts|South Carolina"
            },
            {
                "States": "Florida"
            },
            {
                "States": "Indiana"
            },
            {
                "States": "California|Texas|Florida"
            },
            {
                "States": "Arizona|California|Colorado|Connecticut|Delaware|Illinois|Florida|Maryland|Massachusetts|Nevada|New Hampshire|New Mexico|New York|New Jersey|Pennsylvania|South Carolina|Rhode Island|Texas|Utah|Vermont"
            },
            {
                "States": "Colorado|Connecticut|Florida|Georgia|Illinois|Maryland|Massachusetts|Michigan|Missouri|New Jersey|New Mexico"
            },
            {
                "States": "Arizona|California|Colorado|Minnesota|Nevada|New Jersey|New Mexico|New York|South Carolina|Texas|Utah|Wisconsin"
            },
            {
                "States": "Arizona|California|Colorado|Connecticut|Florida|Illinois|Massachusetts|New Jersey|New York"
            },
            {
                "States": "Arizona|California|Colorado|Connecticut|Florida|Hawaii|Illinois|Maryland|Massachusetts|Nevada|New Hampshire|New Jersey|New Mexico|New York|Pennsylvania|Puerto Rico|Rhode Island|South Carolina|Texas|Vermont|Wisconsin"
            },
            {
                "States": "Alabama|Arizona|Arkansas|California|Colorado|Florida|Georgia|Idaho|Illinois|Kansas|Louisiana|Michigan|Mississippi|Missouri|Nevada|New Mexico|North Carolina|Oklahoma|South Carolina|Tennessee|Texas|Utah|Virginia|West Virginia"
            },
            {
                "States": "Florida"
            },
            {
                "States": "Florida"
            }
        ];
        const data = [];

        for(let i = 1; i < partnerStates.length;i++){
            const zones = partnerStates[i-1]['States'].split('|')
            for(let ii = 0; ii < zones.length;ii++) {
                const zone = zones[ii];
                const partnerZone = {
                    state:  abbrState(zone, 'abbr'),
                    partnerId: i
                }
                data.push(partnerZone)
            }
        }
        await queryInterface.bulkInsert("zones", data, {});

    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('zones');

    }
};
