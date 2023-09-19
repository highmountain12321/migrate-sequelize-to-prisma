const casual = require('casual');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const partners = [
            {

                "name": "American Energy",
                "primaryPhone": "(407) 379-1611",
                "email": "Info.AmericanEnergy.Green",
                "website": "https://www.americanenergy.green",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/american-solar-energy-society.svg"
            },
            {

                "name": "ArrowPoint Solar",
                "primaryPhone": "1-888-459-0494",
                "email": "info@arrowpointsolar.com",
                "website": "https://arrowpointsolar.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/arrow-point.svg"
            },
            {

                "name": "Bright Planet Solar",
                "primaryPhone": "1-888-997- 4469",
                "email": "info@BrightPlanetSolar.com",
                "website": "https://www.brightplanetsolar.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/bright-partner-solar.png"
            },
            {

                "name": "ESD",
                "primaryPhone": "1-800-425-1175",
                "email": "info@energysolutionsdirect.com",
                "website": "https://esdsolar.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/ed-solar.png"
            },
            {

                "name": "Jefferson Electric Solar",
                "primaryPhone": "(317) 418-3917",
                "email": "info@jeffersonelectricllc.com",
                "website": "https://www.jeffersonelectricllc.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/jefferson-solar.png"
            },
            {

                "name": "Kuubix Solar",
                "primaryPhone": "855-458-8249",
                "email": "info@Kuubuxenergy.com",
                "website": "https://kuubixenergy.com/",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/kuubix.svg"
            },
            {

                "name": "Our World Energy",
                "primaryPhone": "623-850-5700",
                "email": "info@ourworldenergy.com",
                "website": "https://www.ourworldenergy.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/our-world-energy.svg"
            },
            {

                "name": "Palmetto Solar",
                "primaryPhone": "877-307-1412",
                "email": "info@Palmetto.com",
                "website": "https://palmetto.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/palmetto.svg"
            },
            {

                "name": "Solcius",
                "primaryPhone": "1-800-960-4150",
                "email": "info@Solcius.com",
                "website": "https://www.solcius.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/solcius.svg"
            },
            {

                "name": "Sunpower",
                "primaryPhone": "1-800-786-7637",
                "email": "info@sunpower.com",
                "website": "http://sunpower.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/sunpower.svg"
            },
            {

                "name": "SunRun",
                "primaryPhone": "1-833-394-3384",
                "email": "info@sunrun.com",
                "website": "http://sunrun.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/sunrun.svg"
            },
            {

                "name": "Titan",
                "primaryPhone": "1-855-729-7652",
                "email": "info@TitanSolarPower.com",
                "website": "https://titansolarpower.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/titan-solar.svg"
            },
            {

                "name": "Unicity",
                "primaryPhone": "727-945-6060",
                "email": "info@UncitySolar.com",
                "website": "https://unicitysolar.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/unicity.png"
            },
            {

                "name": "Urban Solar",
                "primaryPhone": "888-387-6527",
                "email": "info@urbansolar.com",
                "website": "http://urbansolar.com",
                "logoUrl": "https://storage.googleapis.com/sunparison-files/partners/urban.png"
            }
        ]
        const data = [];



        for(let i = 1; i < partners.length;i++){
            const p = partners[i];
            const partner = {
                id:i,
                name: p.name,
                description: "",
                primaryPhone: p.primaryPhone,
                websiteUrl: p.website,
                email: p.email,
                logoUrl: p.logoUrl,
                createdAt: new Date().toISOString().replace('T', ' ').split('Z')[0],
                updatedAt: new Date().toISOString().replace('T', ' ').split('Z')[0],

            }
            console.log(partner);
            data.push(partner)
        }
        await queryInterface.bulkInsert("partners", data, {});

    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('partners');

    }
};
