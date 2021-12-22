
const {Users, Games, Stocks} = require('../dbObjects')
const {Sequelize} = require('sequelize')
const Op = Sequelize.Op;
const fetch = require('node-fetch');

module.exports = {
	name: 'endnow',
	description: 'ends the stock game that is currently active in this channel and declares a winner',
    permissions: 'ADMINISTRATOR',
	async execute(message, args, currency) {
		//this function finds the stocks of all the players within a game and then creates
		//a segmented array, made out of subarrays.
		//why use a segmented array? The scraper can only listen for 10 requests at once, 
		//segmenting these requests into series of 10 makes certain the server isn't overrun.
		async function get(id){
			stocks = await Stocks.findAll({where: {
				game_id: id
			}});
			segmentedArray = [];
			subArray = [];
	
			stocks.forEach(stock => {
				if(subArray.length == 10){
					segmentedArray.push(subArray);
					subArray = [stock];
				}else{
					subArray.push(stock);
				}
			})
			segmentedArray.push(subArray);
			return segmentedArray;
		}
		async function call(segmentedArray, currency){
				return new Promise(async (resolve, reject) =>{
				async function next(arr, index){
					if(index < segmentedArray.length){
						p = await segmentedArray[index].map(async stock => {
							return new Promise(async (resolve, reject) => {
								let cost = await fetch(`http://localhost:3000/bid/${stock.stock_id}`)
								.then(response => {
									//case where there was an error when scraping
									if (!response.ok) {
										return;
									}
									return response.text();
								})
								.then(res => {
									//tries to parse as JSON, returns error otherwise
									try{
										return JSON.parse(res);
									}catch(err) {
										return resolve([0,0]);
									}
										
								})
								.then(body => {
									//gets the price variable from the JSON
									return body.price.split(" ")[0].replace(',','');
								})
								.catch(function(error) {
									//case where stock did not exist
									console.log(`${error}`)
									return resolve([0, 0]);
								});
				
								if(!cost || isNaN(cost)){
								}
								else{
									price = parseFloat(stock.amount) * parseFloat(cost);
								}
								return resolve([stock.user_id, price]);
							});
						});
						res = await Promise.all(p);
						arr.push(res);
						next(arr, index + 1);

					}
					else{
						resolve(arr[0]);
					}
				}
				next([],0)
			})
		}
		message.channel.send(`Calculating leaderboard...`);

		segmentedArray = await get(message.channel.id);
		
		await Promise.resolve(call(segmentedArray, currency))
		.then(async res => {
			p = await new Promise((resolve, reject) => {
				dict = new Object();
				res.map((vals) => {
					if(isNaN(dict[vals[0]])){
						dict[vals[0]] = parseFloat(vals[1]);
					}
					else{
						dict[vals[0]] += parseFloat(vals[1]);
					}
				});

				return resolve(dict);
			})
			return await Promise.resolve(p)
			.then( async response =>{
				users = await Games.findAll({
					where: {game_id: message.channel.id}
				});
				users.map(async user => {
					if(isNaN(response[user.user_id])){
						response[user.user_id] = parseFloat(user.balance).toFixed(2);
					}
					else{
						response[user.user_id] = (parseFloat(user.balance) + response[user.user_id]).toFixed(2);
					}
				});
				return response;
			});
		})
		.then(users => {
			var today = new Date();
			var date = (today.getMonth()+1)+'/'+today.getDate()+'/'+today.getFullYear();
			finalString = '';
			sortedKeys = Object.keys(users).sort(function(a,b){return users[b]-users[a]})
			if(sortedKeys.length > 10){
				sortedKeys = sortedKeys.slice(0, 10);
			}
			for(i = 0; i < sortedKeys.length; i++){
				if(i == 0){
					Games.increment(
						{total_wins: +1},
						{where: {user_id: sortedKeys[i]}}
					);
				}
				Games.update(
					{last_placed: `${i+1} on ${date}`},
					{where: {game_id: message.channel.id, user_id: sortedKeys[i]}}
				);;
				withCommas = users[sortedKeys[i]].toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")
				finalString += `${i+1}.) <@${sortedKeys[i]}> ${withCommas}💰\n`
			}
			message.channel.send(`<@${sortedKeys[0]}> Wins!\n` + finalString);
		})
		.then(async () => {
			Stocks.destroy({
				where: {game_id: message.channel.id}
			});
			games = await Games.findAll(
				{where: {game_id: message.channel.id}}
			)
			games.forEach(game => {
				current = currency.get(`${game.game_id}${game.user_id}`);
				current.balance = 0;
				current.save();
			})
		})
		return 0;
	},
};