//requires the prefix from the config file
const {prefix} = require("../config.json")
module.exports = {
	name: 'message',
	async execute(message, client, Discord, currency) {
        //gets the list of arguments and then the command name, using this argument list
		const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        //sees if the command name is a real command or an alias for a command
        const command = client.commands.get(commandName) || client.commands.find(cmd =>cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;

        //case in which the command arguments weren't of the proper length
        if (command.args && !args.length) {
            let reply = `You didn't provide any arguments, ${message.author}!`;
            if (command.usage) {
                reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
            }
            return message.channel.send(reply);
        }

        //case in which the command is server specific
        if (command.guildOnly && message.channel.type === 'dm') {
            return message.reply('I can\'t execute that command inside DMs!');
        }

        //case in which player does not have access to the command given
        if (command.permissions) {
            const authorPerms = message.channel.permissionsFor(message.author);
            if (!authorPerms || !authorPerms.has(command.permissions)) {
                return message.reply('You can not do this!');
            }
        }

        //case in which their is no cooldown present on the command
        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Discord.Collection());
        }

        //gets the current time, then the command cooldown, and finally the cooldown time
        const now = Date.now();
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        //tests if the player is violating the set cooldown by seeing if the player exists in timestamp and then seeing if it is past the cooldown expiration
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name} command.`);
            }
        }

        //sets a new cooldown for player in timestamps
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        //executes the command, some commands need the currency which is the purpose of the if statement.
        try {
            console.log(commandName);
            command.execute(message, args, currency);
        }catch (error) {
            console.error(error);
            message.reply("This command was not found");
        }
	},
};