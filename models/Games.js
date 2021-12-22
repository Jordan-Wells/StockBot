module.exports = (sequelize, DataTypes) => {
	return sequelize.define('games', {
		user_id: DataTypes.STRING,
		game_id: DataTypes.STRING,
		last_placed: DataTypes.STRING,
		total_wins: DataTypes.INTEGER,
		balance: {
			type: DataTypes.FLOAT,
			defaultValue: 0,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};