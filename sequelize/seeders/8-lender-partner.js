const casual = require('casual');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const partners = []
        const data = [];

        const ids = [];
        for(let i = 1; i < 10;i++){
            const lenderId = i;
            for(let ii = 1; ii < 10;ii++) {
                const partnerId = ii;

                    const partner = {
                        partner_id: lenderId,
                        lender_id: partnerId,
                        "createdAt": new Date(),
                        "updatedAt": new Date()
                    }
                    data.push(partner)

            }
        }

        await queryInterface.bulkInsert("lender_partner", data, {});

    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('lender_partner');

    }
};
