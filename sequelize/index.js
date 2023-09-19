const fs        = require('fs');
const path      = require('path');
const { Sequelize } = require('sequelize');
const { applyExtraSetup } = require('./extra-setup');
const { applyCommercialSetup } = require('./commercial-setup');



const db        = {};

// In a real app, you should keep the database connection URL as an environment variable.
// But for this example, we will just use a local SQLite database.
// const sequelize = new Sequelize(process.env.DB_CONNECTION_URL);
const sequelize = new Sequelize(null,{
    dialectOptions: {
        multipleStatements: true
    },
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    logging: false
});


const getAllFiles = function(dirPath, arrayOfFiles) {
    let files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file))
        }
    })

    return arrayOfFiles
}

getAllFiles(__dirname+'/models').forEach((file)=>{
    if (file.slice(-3) !== '.js') return;

    const p = path.join(__dirname+'/models', file);
    require(file)(sequelize);
});






fs
    .readdirSync(__dirname+'/models')
    .filter(function(file) {
        return (file.indexOf('.') !== 0);
    })
    .forEach(function(file) {
        if (file.slice(-3) !== '.js') return;

        const p = path.join(__dirname+'/models', file);
        const model = require(p)(sequelize);
        //db[model.name] = model;


    });


/*
console.log('syncing')

sequelize.sync().then(function(){
    // tslint:disable-next-line:no-console
    console.log('synced')
})
*/

// We execute any extra setup after the models are defined, such as adding associations.
applyExtraSetup(sequelize);
applyCommercialSetup(sequelize);

// We export the sequelize connection instance to be used around our app.
module.exports = sequelize;
