const {Games, Users} = require("./../dbObjects");
require('sequelize')
module.exports = {
	name: 'add',
	description: 'add player to particular server',
    permissions: 'ADMINISTRATOR',
	usage: '@<list of players> <amount>',
	execute(message, args, currency) {
		async function get(message, args, currency){
			//case where no player was specified
			if (!message.mentions.users.size) {
				return message.channel.send(`No user was mentioned`);
			}
			if(isNaN(args.slice(-1)[0])){
				return message.channel.send("Amount specified must be a number")
			}
			promises = await message.mentions.users.map(async user => {
				res = await new Promise(async (resolve, reject) => {
					error = await currency.add(user.id, message.channel.id, parseFloat(args.slice(-1)[0]));
					if(error){
						message.channel.send(`${error}`);
					}
					return resolve('Success')
				});
				return res;
			})
			ress = await Promise.all(promises)
			message.channel.send('All users have been added.')
		}
		return get(message, args, currency);
	},
};