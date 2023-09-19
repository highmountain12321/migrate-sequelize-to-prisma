const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('contact_update', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        note:{
            type: DataTypes.STRING
        },
        tags:{
            type: DataTypes.JSON
        },
        group: {
            type: DataTypes.STRING,
            default:'default'
        },
        test: {
            type: DataTypes.BOOLEAN
        },

    }, {
        createdAt: true,
        updatedAt: false,
        hooks: {

            beforeCreate: (update) => {

                if (process.env.ENVIRONMENT === 'dev') {
                    update.test = true;
                }
                if (update.note) {
                    update.note = update.note.trim();
                }
            },
            afterCreate: async (object) => {
                const {models} = require("../../index");

                /// send notifications
                const optionModel = await models.option.findByPk(object.toId);
                const contactModel = await models.contact.findByPk(object.contactId);
                if (optionModel && optionModel.notifications) {
                    const {closers, setters, managers} = optionModel.notifications;
                    const notificationPayload = {
                        contactName: `${contactModel.firstName} ${contactModel.lastName}`,
                        statusName: `${optionModel.name}`
                    }
                    if (closers) {
                        const closerModels = await contactModel.getUsers({
                            separate: true,
                            include: [{
                                where: {
                                    slug: 'closer'
                                },
                                model: models.role,
                                as: 'role'
                            }]
                        });
                        for (let i = 0; i < closerModels.length; i++) {
                            const model = closerModels[i];
                            await model.sendEmail({
                                templateName: 'statusChangeNotification',
                                parameters: notificationPayload
                            });
                        }
                    }
                    if (setters) {
                        const setterModels = await contactModel.getUsers({
                            separate: true,
                            include: [{
                                where: {
                                    slug: 'setter'
                                },
                                model: models.role,
                                as: 'role'
                            }]
                        });
                        for (let i = 0; i < setterModels.length; i++) {
                            const model = setterModels[i];
                            await model.sendEmail({
                                templateName: 'statusChangeNotification',
                                parameters: notificationPayload
                            });
                        }
                    }
                    if (managers) {
                        const groupModels = await contactModel.getGroups({separate: true});
                        for (let i = 0; i < groupModels.length; i++) {
                            const groupModel = groupModels[i];
                            const groupManagers = await groupModel.getManagers();
                            for (let ii = 0; ii < groupManagers.length; ii++) {
                                const groupManagerModel = groupManagers[ii];
                                await groupManagerModel.sendEmail({
                                    templateName: 'statusChangeNotification',
                                    parameters: notificationPayload
                                });
                            }
                        }
                    }

                }
            }
        }
    });
};
