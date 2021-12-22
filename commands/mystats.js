const { Users , Games} = require('../dbObjects')

module.exports = {
	name: 'mystats',
    description: 'Gives you your total number of wins.',
    args: false,
	async execute(message) {
		user = await Users.findOne({
			where: {user_id: message.author.id}
		});
		game = await Games.findOne(
			{where: {user_id: message.author.id, game_id: message.channel.id}}
		);
		message.channel.send(`<@${message.author.id}>, you have won ${user.total_wins} total games.\nIn this server, you last placed ${game.last_placed}`);
	},
};