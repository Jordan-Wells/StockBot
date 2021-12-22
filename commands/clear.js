const {Users, Games} = require('../dbObjects')
const {Sequelize} = require('sequelize')
const Op = Sequelize.Op;
require('sequelize')

module.exports = {
	name: 'clear',
	description: 'remove all stocks an players from a particular server',
    permissions: 'ADMINISTRATOR',
	async execute(message, args, currency) {
		const users = await Games.findAll({where: {game_id: message.channel.id}});
		
		let userIDs = [];
		users.forEach(i => {
			userIDs.push(i.user_id);
		});
		gameUsers = await Users.findAll({where: {
			user_id:{
				[Op.or]: userIDs
			}
		}});
		gameUsers.forEach(user =>{
			user.clearStocks(message);
			user.clearGame(message);
			currency.delete(`${message.channel.id}${user.user_id}`);
		});
		return message.channel.send("All content has been deleted");
	},
};