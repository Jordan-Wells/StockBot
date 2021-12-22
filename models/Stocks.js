module.exports = (sequelize, DataTypes) => {
    return sequelize.define('stocks', {
        user_id: DataTypes.STRING,
        game_id: DataTypes.STRING,
        stock_id: DataTypes.STRING,
        amount: DataTypes.FLOAT,
    }, {
        timestamps: false,
    })
}