const casual = require('casual');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const data = [{
            name:'Good Leap',
            websiteUrl:'',
        },{
            name:'Sunlight',
            websiteUrl:'',
            primaryPhone:''
        },{
            name:'Mosaic',
            websiteUrl:'',
            primaryPhone:''
        },{
            name:'Dividend',
            websiteUrl:'',
            primaryPhone:''
        },{
            name:'Sunnova',
            websiteUrl:'',
            primaryPhone:''
        },{
            name:'Ygrene',
            websiteUrl:'',
            primaryPhone:''
        },{
            name:'Homerun',
            websiteUrl:'',
            primaryPhone:''
        },{
            name:'Nexa',
            websiteUrl:'',
            primaryPhone:''
        }];



        const forceSync = async () => {
            await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
            await queryInterface.sequelize.sync({ force: true });
        };

        await forceSync();

        await queryInterface.bulkInsert("lenders", data, {});

    },

    down: async (queryInterface, Sequelize) => {
        const forceSync = async () => {
            await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
            await queryInterface.sequelize.sync({ force: true });
        };

        await forceSync();

        await queryInterface.dropTable('lenders');

    }
};
