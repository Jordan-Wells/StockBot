module.exports = {
	name: 'balance',
	description: 'checks balance of member',
    //aliases: ['icon', 'pfp'],
	execute(message, args, currency) {
        const target = message.author
        return message.channel.send(`${target.tag} has ${Number(currency.getBalance(`${message.channel.id}${target.id}`)).toFixed(2)}💰`)
	},
};