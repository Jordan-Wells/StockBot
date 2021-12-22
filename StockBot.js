//requires fs and then reads ".js" files in "/commands" and "/events" directories
const fs = require("fs");
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

//dbObjects has database relation functions stored within. config has the needed prefix and bot API token
const {Users, Games }  = require('./dbObjects');
const {token, prefix} = require("./config.json");

//requires Discord API so that we can intereface with discord. Defines a client which is then used to load respective commands, cooldowns, and currencies
const Discord = require("discord.js");
const client = new Discord.Client();
client.cooldowns = new Discord.Collection();
client.commands = new Discord.Collection();
const currency = new Discord.Collection();

//function that adds currency to a player's balance
Reflect.defineProperty(currency, 'add', {
    value: async function add(user_id, game_id, amount) {
		//returns balance of user, identified with their game and user id concatenated. if this value is not null, player exists
        const user = currency.get(`${game_id}${user_id}`);
		
		//checks if user exists
        if(user) {
			//parses the database's balance and active balance and then adds them together, then saving this in the active balance
			const x = parseFloat(user.balance) ;
			const y = parseFloat(amount);
			const z = parseFloat(x + y);
			user.balance = z;
            user.save();
        }else{
			//returns a user from the database if it exists
			const user = await Users.findOne({where: {user_id: user_id}});

			//if this player doesn't exist, creates one as well as a game
			if(!user){
				await Users.create({
					user_id: user_id, 
				});
				const game = await Games.create({
					user_id: user_id, 
					game_id: game_id,
					total_wins: 0,
					last_placed: 'None',
					balance: parseFloat(amount)
				});
				currency.set(`${game_id}${user_id}`, game);
				return;
			}

			const game = await Games.findOne({where: {
				user_id: user_id,
				game_id: game_id
			}});

			if(!game){
				const game = await Games.create({
					user_id: user_id, 
					game_id: game_id,
					total_wins: 0,
					last_placed: 'None',
					balance: parseFloat(amount)
				});
				currency.set(`${game_id}${user_id}`, game);
				return;
			}
			return "Error occurred in database. Please message the proprietor of this bot at jordanwells#7907";
		}


		//adds this user to the current game and then sets their currency
		//return currency.set(`${game_id}${user_id}`, parseFloat(amount));
    },
}) 


//returns the balance of a player, if they exist
Reflect.defineProperty(currency, 'getBalance', {
    value: function getBalance(id) {
        const user = currency.get(id);
        return user ? user.balance : 0;
    },
})

//reads each file in commands directory and loads them into the client as commands
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

//reads each file in events directory and loads them into the client as commands
for(const file of eventFiles) {
	const event = require(`./events/${file}`)
	if (event.once) {
		client.once(event.name, async (...args) => await event.execute(...args, client, currency));
	}else{
		client.on(event.name, async (...args) => await event.execute(...args, client, Discord, currency));
	}
}

//logs into the client
client.login(token)

