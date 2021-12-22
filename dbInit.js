//loads the config, mysql, and sequelize
const config = require('./config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

//calls function described below which creates the database
initialize();

async function initialize() {
    //creates database if it doesn't already exist
    const { host, port, user, password, database } = config.database;
    const connection = await mysql.createConnection({ host: `${host}`, port: `${port}`, user: `${user}`, password: `${password}` });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    //connects to database
    const sequelize = new Sequelize(database, user, password, { dialect: 'mysql' });

    //initializes models and adds them to the exported database object
    require('./models/Users')(sequelize, Sequelize.DataTypes);
    require('./models/Stocks')(sequelize, Sequelize.DataTypes);
    require('./models/Games')(sequelize, Sequelize.DataTypes);

    const force = process.argv.includes('--force') || process.argv.includes('--f');

    //syncs all models with database
    await sequelize.sync({force}).then(async () => {
        console.log('Database synced');
        sequelize.close();
    }).catch(console.error);
}


//await sequelize.sync();