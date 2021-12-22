const { Users , Games} = require('../dbObjects')

//In production
module.exports = {
	name: 'setgame',
    description: 'Starts a game with a specified end date and starting amount. All players on server are added and there must be no active game on this channel. This game will be recurring so type !endnow if you no longer want it to run.',
    args: true,
	async execute(message, args) {

	},
};