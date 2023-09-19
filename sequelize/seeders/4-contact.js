const casual = require('casual');
module.exports = {
  up: async (queryInterface, Sequelize) => {
    let data = [];
    for(let i = 1; i < 100; i++){
      data.push({
        "id": i,
        "firstName": casual.first_name,
        "lastName": casual.last_name,
        "middleName": null,
        "gender": null,
        "address1": casual.address1,
        "address2": null,
        "city": casual.city,
        "state": casual.state_abbr,
        "interests": null,
        "postalCode": casual.zip(5),
        "sourceId": casual.integer(1,3) ,
        "hasLED": casual.coin_flip ,
        "hasSmartThermostat": casual.coin_flip ,
        "hasSolar": casual.coin_flip ,
        "isHomeowner": casual.coin_flip ,
        "isSpanishSpeaker": casual.coin_flip ,
        "primaryPhone": casual.phone,
        "secondaryPhone": casual.phone,
        "email": casual.email,
        "creditScore": casual.integer(400,800),
        "quoteOnly": casual.coin_flip,
        "estimatedCloseDate": null,
        "closeDate": new Date(),
        "leadDate": new Date(),
        "sitDate": new Date(),
        "dropDate": null,
        "salePotential": casual.integer(1,5),
        "isActive": true,
        "user1Id":1,
        "user2Id":null,
        "user3Id":null,
        "createdAt": new Date(),
        "updatedAt": new Date()
      })
    }
    await queryInterface.bulkInsert('contacts', data, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('contacts');

  }
};
