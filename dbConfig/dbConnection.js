const { Sequelize } = require("sequelize");
require("dotenv").config();

// Option 1: Passing a connection URI
//const sequelize = new Sequelize('sqlite::memory:') // Example for sqlite
//const sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname') //

const sequelize = new Sequelize(
  assignment,
  admin,
  ritesh123,
  {
    host: assignment.cbskc0sm81a4.ap-south-1.rds.amazonaws.com,
    dialect: "mysql",
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = {
  connectDB,
  sequelize,
};
