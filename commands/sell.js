//company amount
const fetch = require('node-fetch')
const { Users , Games, Stocks} = require('../dbObjects')

module.exports = {
	name: 'sell',
	description: 'takes <list of company tickers> <num of stocks> and sells number of stocks for determined price.',
	usage: '<list of company tickers> <num of stocks>',
	execute(message, args, currency) {
		async function get(message, args,currency)  {
			//case when incorrect parameters were given
			if (args.length < 2) return message.channel.send(`${message.author}, !buy requires parameters <company> <num of stocks>`) ;
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

					
					valid = await user.removeStock(message, arg, amt, 1);
					if(valid == 1){
						//send request to scraper to find current buying price of stock
						let cost = await fetch(`http://localhost:3000/bid/${arg}`)
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
								message.channel.send(`Sorry ${message.author}, we couldn't find stock ${arg}.`)
								return resolve(0);
							}
							
						})
						.then(body => {
							//gets the price from the JSON, replacing any commas with so it can be read as float
							return body.price.split(" ")[0].replace(',', '');
						})
						.catch(function(error) {
							message.channel.send(`Sorry ${message.author}, we couldn't find stock ${arg}.`)
							return resolve(0);
						})
			
						//case where there was no cost returned
						if(!cost || isNaN(cost)){
							message.channel.send(`Stock ${arg} could not be found`)
							return resolve(0);
						}
						price = parseFloat(cost) * amt;
						totalCost += price;
						currency.add(message.author.id, message.channel.id, price);
						return resolve(arg);
					}
					return resolve(0);
				});
				return stock;
			});
			let stocks = await Promise.all(promises)
			let stockStr = '';
			
			//gets the string of stocks that were bought properly to be displayed
			stocks.forEach(stock => {
				if(stock !== 0){
					if(stockStr == ''){
						stockStr = stock;
					}
					else{
						stockStr = stockStr.concat(', ', stock);
					}
				}
			})

			//returns confirmation
			return message.channel.send(`${amt} stock(s) of ${stockStr} have been sold by ${message.author} for ${Number(totalCost).toFixed(2)}💰.`)
		}
		return get(message,args,currency)
	},
};