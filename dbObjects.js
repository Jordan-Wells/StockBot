//requires sequelize and config, then loads the database configs and initializes a conenction
const Sequelize = require('sequelize')
const config = require('./config.json')
const { host, port, user, password, database } = config.database;
const sequelize = new Sequelize(database, user, password, {
    host: host,
    port: port,
    dialect: 'mysql',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
})

//loads the database models
const Users = require('./models/Users')(sequelize, Sequelize.DataTypes);
const Stocks = require('./models/Stocks')(sequelize, Sequelize.DataTypes);
const Games = require('./models/Games')(sequelize, Sequelize.DataTypes);

Stocks.prototype.getUser = async function(){
    const user = await Users.findOne({where: {
        user_id: this.user_id
    }});
    return user;
}
//adds stock to user's game in database
Users.prototype.addStock = async function(message, id, amount) {
    //gets the current stock information. returns null if player does not own this stock within the game
    const userPlayer = await Stocks.findOne({
        where: {user_id: this.user_id, game_id: message.channel.id, stock_id: id}
    });

    //if the stock does exist in database, adds the new number of stocks to the old number and then saves
    if (userPlayer) {
        userPlayer.amount = parseFloat(amount) + parseFloat(userPlayer.amount);
        userPlayer.save();
        return
    }
    //creates a new stock in the database otherwise
    return Stocks.create({ user_id: this.user_id, game_id: message.channel.id, stock_id: id, amount: amount});
}

//adds a new user to a game in the database
Users.prototype.addGame = async function(message, amount) {
    //gets information about the user in a given game. returns null if player is not currently in game
    const user = await Games.findOne({
        where: {user_id: this.user_id, game_id: message.channel.id}
    });

    //if user exists in game, parses the existing and new balance, adds them together, saves and returns a message for verification
    if(user){
        //var 
        const x = parseFloat(user.balance);
        const y = parseFloat(amount);
        user.balance = 0;
        user.balance += x + y;
        return message.channel.send(`User ${message.mentions.users.first()} was updated.`);
    }
    //creates a new player in the game and then returns a message for verification otherwise
    Games.create({user_id: this.user_id, game_id: message.channel.id, amount: amount});
    return message.channel.send(`User ${message.mentions.users.first()} was added.`);
}

//removes a number of stocks from a player within database
Users.prototype.removeStock = async function(message, id, amount, showMessage) {
    //case when we want to display the message in chat
    if(showMessage){
        //gets the stock information of player within a given game. returns null if the stock doesn't exist
        const userPlayer = await Stocks.findOne({
            where: {user_id: this.user_id, game_id: message.channel.id, stock_id: id}
        });

        //if this stock was found within this database
        if (userPlayer) {
            //note: returns 0 to display message and not add to balance, returns 1 to only not add to balance, returns 2 to add to balance

            //if the player has more stocks than was removed, subtracts this value, saves, and returns
            if(userPlayer.amount > amount){
                userPlayer.amount = parseFloat(userPlayer.amount) - parseFloat(amount)
                userPlayer.save();
                return 1;
            }
            //if the amounts are the same, removes stock all together and returns
            else if(userPlayer.amount == amount) {
                Stocks.destroy({where: { user_id: this.user_id, game_id: message.channel.id, stock_id: id}});
                return 1;
            }
            //player does not own enough stock otherwise, so displays message and returns
            else{
                message.channel.send(`You own ${userPlayer.amount} stocks of ${id}, so you cannot sell ${amount}.`);
                return 0;
            }
        }
        //player does not own stock generally since it was not found, so display message and return
        message.channel.send(`You must own ${id} to sell it`);
        return 0;
    }
    else{
        //if the player has more stocks than was removed, subtracts this value, saves, and returns
        if(userPlayer.amount > amount){
            userPlayer.amount = parseFloat(amount) + parseFloat(userPlayer.amount);
            userPlayer.save();
            return 2;
        }
        //if the amounts are the same, removes stock all together and returns
        else if(userPlayer.amount == amount) {
            Stocks.destroy({where: { user_id: this.user_id, game_id: message.channel.id, stock_id: id}});
            return 2;
        }
        return 0;
    }
    
}

//removes stock from player's game inventory database
Users.prototype.clearStocks = async function(message) {
    return Stocks.destroy({where: { user_id: this.user_id, game_id: message.channel.id}});
}

//removes player from game in database
Users.prototype.clearGame = async function(message) {
    return Games.destroy({where: {user_id: this.user_id, game_id: message.channel.id}});
}

//gets all the stocks a player owns
Users.prototype.getStocks = async function(message) {
    return Stocks.findAll({
    where: { user_id: this.user_id, game_id: message.channel.id},
       //include: ['player_id', 'amount'],
    });
}


module.exports = {Users, Stocks, Games}