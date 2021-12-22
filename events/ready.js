const { Games } = require('./../dbObjects')
require('sequelize')

module.exports = {
	name: 'ready',
	once: true,
	//async: true,
	execute(client, currency) {
		async function call(client, currency){
			//gets all database balances and adds them to the active currency dictionary
			const storedBalances = await Games.findAll();
			storedBalances.forEach(b => currency.set(`${b.game_id}${b.user_id}`, b));

			console.log("Connected as " + client.user.tag, currency);

			//sets the bots status on discord
			client.user.setActivity("for new steals", {type: "WATCHING"});

			client.guilds.cache.forEach((guild) => {
				console.log(guild.name);
				guild.channels.cache.forEach((channel) => {
					console.log(` - ${channel.name} ${channel.type} ${channel.id}`);
				});
			});
		}

		call(client, currency);
	},
};