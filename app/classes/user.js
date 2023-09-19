const { models, query } = require('../../sequelize');

module.exports = class User {
    constructor(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    display() {
        console.log(this.firstName + " " + this.lastName);
    }
}
