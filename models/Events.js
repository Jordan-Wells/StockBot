module.exports = (sequelize, DataTypes) => {
	return sequelize.define('events', {
		game_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		recurring: DataTypes.BOOLEAN,
		amount: DataTypes.FLOAT,
		end_date: DataTypes.DATEONLY
	}, {
		timestamps: false,
	});
};