//company amount
const fetch = require('node-fetch')
const { Users , Games} = require('../dbObjects')

module.exports = {
	name: 'buy',
	description: 'takes <company> <num of stocks> and adds number of stock to user profile.',
	usage: '<company> <num of stocks>',
	execute(message, args, currency) {
		async function get(message, args,currency)  {
			//case when incorrect parameters were given
			if(args.length < 2) return message.channel.send(`${message.author}, !buy requires parameters <company> <num of stocks>`) ;
			if(args.length > 11) return message.channel.send(`You can only buy from 10 companies at a time`);
			amt = args.splice(-1)[0];
			//case where given number was negative
			if (Math.sign(amt) !== 1 || isNaN(amt)) return message.channel.send(`${message.author}, you must put in a positive value for number of stocks`);
			
			//finds the user in database
			const user = await Users.findOne({where: {user_id: message.author.id}});
			const game = await Games.findOne({where: {
				user_id: message.author.id,
				game_id: message.channel.id
			}});

			if(!user || !game){
				return message.channel.send(`${message.author.username}, you are not registered for this game. Have an admin add you before you play.`);
			}

			totalCost = 0;
			const promises = await args.map(async arg =>{
				const stock = new Promise(async (resolve,reject) => {
					if(!isNaN(arg)){
						return resolve(0);
					}
					//send request to scraper to find current buying price of stock
					let cost = await fetch(`http://localhost:3000/ask/${arg}`)
					.then(response => {
						//case stock ticker did not exist
						if (!response.ok) {
							message.channel.send(`Sorry ${message.author}, there was an error when searching for stock ${arg}.`)
							return
						}
						return response.text();
					})
					.then(res => {
						//tries to parse result from scraper as JSON, catches and returns if it cannot be
						try{
							return JSON.parse(res)
						}catch(err) {
							//message.channel.send(`Sorry ${message.author}, we couldn't find stock ${arg}.`)
							return resolve(0);
						}
						
					})
					.then(body => {
						//gets the price from the JSON, replacing any commas with so it can be read as float
						return body.price.split(" ")[0].replace(',', '');
					})
					.catch(function(error) {
						//message.channel.send(`Sorry ${message.author}, we couldn't find stock ${arg}.`)
						return resolve(0);
					})
		
					//case where there was no cost returned
					
					//case where there was no cost returned
					if(!cost || isNaN(cost)){
						cost = 0;
					}
					
					price = parseFloat(cost) * amt;
					if(price == 0){
						//message.channel.send(`Stock ${arg} could not be found`)
						return resolve(0);
					}
					else if(currency.get(`${game.game_id}${game.user_id}`).balance < price){
						//message.channel.send(`You have ${game.balance}💰, but ${amt} shares of ${arg} costs ${price}💰.`);
						return resolve(0);
					}
					currency.add(message.author.id, message.channel.id, -price);
					user.addStock(message, arg, amt);
					totalCost += price;
					return resolve(arg);
				});
				return stock;
			});
			stocks = await Promise.all(promises)
			validStocks = [];

			//gets the string of stocks that were bought properly to be displayed
			stocks.forEach(stock => {
				if(stock !== 0){
					validStocks.push(stock);
				}
			})
			difference = args.filter(x => !validStocks.includes(x));
			//returns confirmation
			if(!difference.length){
				return message.channel.send(`${amt} stock(s) of ${validStocks.join(', ')} have been added to ${message.author}'s account for ${Number(totalCost).toFixed(2)}💰.`)
			}else if(!validStocks.length){
				return message.channel.send(`You did not have enough to buy ${amt} stocks of ${difference.join(', ')} or an error occured.`)
			}else{
				return message.channel.send(`You did not have enough to buy ${difference.join(', ')}.\n${amt} stocks of ${validStocks.join(', ')} were still bought for ${totalCost}💰`)
			}
		}
		return get(message,args,currency)
	},
};