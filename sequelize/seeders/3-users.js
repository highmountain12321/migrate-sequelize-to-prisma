'use strict';
const casual = require('casual');

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const metadata = JSON.stringify({
      isManager: false,
      leadFee: 2.70,
      setterFee: .30
    });
    await queryInterface.bulkInsert('users', [
      {
        firstName: casual.first_name,
        lastName: casual.last_name,
        picUrl:`https://avatars.dicebear.com/api/male/${casual.first_name}.svg`,
        email: 'admin@good3nergy.com',
        password: "5f4dcc3b5aa765d61d8327deb882cf99",
        primaryPhone:"5555555555",
        isSpanishSpeaker:false,
        passwordHash: "",
        isActive: true,
        userGroupId:casual.integer(1,5),
        roleId:1,
        order:1,
        group:'default',
        metadata:metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        firstName: casual.first_name,
        lastName: casual.last_name,
        picUrl:`https://avatars.dicebear.com/api/male/${casual.first_name}.svg`,
        email: 'demo-setter@good3nergy.com',
        password: "5f4dcc3b5aa765d61d8327deb882cf99",
        primaryPhone:"5555555555",
        isSpanishSpeaker:false,
        passwordHash: "",
        isActive: true,
        userGroupId:casual.integer(1,5),
        roleId:1,
        order:1,
        group:'default',
        metadata:metadata,
        createdAt: new Date(),
        updatedAt: new Date(),


      },
      {
        firstName: casual.first_name,
        lastName: casual.last_name,
        picUrl:`https://avatars.dicebear.com/api/male/${casual.first_name}.svg`,
        email: 'demo-closer@good3nergy.com',
        password: "5f4dcc3b5aa765d61d8327deb882cf99",
        primaryPhone:"5555555555",
        isSpanishSpeaker:false,
        passwordHash: "",
        isActive: true,
        userGroupId:casual.integer(1,5),
        roleId:2,
        order:1,
        group:'default',
        metadata:metadata,
        createdAt: new Date(),
        updatedAt: new Date(),

      },{
        firstName: casual.first_name,
        lastName: casual.last_name,
        picUrl:`https://avatars.dicebear.com/api/male/${casual.first_name}.svg`,
        email: 'demo-partner@good3nergy.com',
        password: "5f4dcc3b5aa765d61d8327deb882cf99",
        primaryPhone:"5555555555",
        isSpanishSpeaker:true,
        passwordHash: "",
        isActive: true,
        userGroupId:1,
        roleId:4,
        order:1,
        group:'default',
        metadata:metadata,
        createdAt: new Date(),
        updatedAt: new Date(),

      },{
        firstName: casual.first_name,
        lastName: casual.last_name,
        picUrl:`https://avatars.dicebear.com/api/male/${casual.first_name}.svg`,
        email: 'demo-contact@good3nergy.com',
        password: "5f4dcc3b5aa765d61d8327deb882cf99",
        primaryPhone:"5555555555",
        isSpanishSpeaker:true,
        passwordHash: "",
        isActive: true,
        userGroupId:1,
        roleId:3,
        order:1,
        group:'default',
        metadata:metadata,
        createdAt: new Date(),
        updatedAt: new Date(),

      }
    ],{});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
