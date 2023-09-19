const { DataTypes } = require('sequelize');
const generateApiKey = require('generate-api-key').default;

 
module.exports = (sequelize) => {
    sequelize.define('api_key', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        apiKey: {
            type: DataTypes.STRING
        },
        limit: {
            type: DataTypes.STRING
        },
        count: {
            type: DataTypes.INTEGER
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:true
        },
        requestDate: {
            type: DataTypes.DATE
        }


    },{
        createdAt: true,
        updatedAt: false,
        hooks:{
            beforeCreate: async (c) => {
                if(!c.apiKey || c.apiKey === ""){
                    c.apiKey  = generateApiKey({ method: 'bytes', length: 8 });
                }
                if (process.env.ENVIRONMENT === 'dev') {
                    c.test = true;
                }
            }
        }
    });
};
