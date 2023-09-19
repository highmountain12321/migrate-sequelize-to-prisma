'use strict';
const casual = require('casual');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const data = [];
    data.push({
      id:1,
      name: 'default',
      slug: 'default',
      isDefault: true,
      isActive: true
    })
    for(let i = 2; i < 6;i++){
      const name = casual.integer(1000,6000);
      data.push({
        id:i,
        name: name,
        slug: name,
        isDefault: false,
        isActive: true
      })
    }

    await queryInterface.bulkInsert('user_groups', data, {});

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_groups');

  }
};
