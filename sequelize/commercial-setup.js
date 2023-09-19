//Player.belongsTo(Team)  // `teamId` will be added on Player / Source model
///Coach.hasOne(Team)  // `coachId` will be added on Team / Target model

function applyCommercialSetup(sequelize) {
    const {
        poc,
        poc_role,
        contact
    } = sequelize.models;


    contact.hasMany(poc, {as: 'pocs'});
    poc.belongsTo(poc_role,{as:'role'});

}

module.exports = {applyCommercialSetup};
