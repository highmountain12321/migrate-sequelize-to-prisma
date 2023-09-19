
const {DataTypes, Sequelize} = require('sequelize');

module.exports = (sequelize) => {
    const model = sequelize.define('project', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING,
        },
        description: {
            type: DataTypes.STRING,
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        virtName: {
            type: DataTypes.VIRTUAL,
            get() {
                if (this.contact && !this.contact.busName) {
                    return `${this.contact.firstName} ${this.contact.lastName}`;
                } else {
                    if(this.contact) {
                        return `${this.contact.busName}`;
                    }
                }
                return false;
            },
            set(value) {
                throw new Error('Do not try to set the `full_address` value!');
            }
        },

    }, {
        timestamps: true,
        hooks: {
            afterCreate: async (c) => {

            }
        }

    });

    return model;
};
