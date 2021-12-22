const {Games, Users} = require("../dbObjects");
require('sequelize')
module.exports = {
	name: 'stocks',
	description: 'gets users current stocks',
	async execute(message, args) {
        //gets the author and then finds them in database
        const target = message.author;
        const user = await Users.findOne({where: {user_id: target.id} });

        //find all of the users stocks, returns null otherwise
        const items = await user.getStocks(message);

        //case where author does not own stock
        if (!items.length) return message.channel.send(`${target.tag} has nothing!`);

        //returns all of the stocks the player owns otherwise
        return message.channel.send(`${target.tag} currently has ${items.map(i => `${i.amount} stocks of ${i.stock_id}`).join(', ')}.`);
    },
}