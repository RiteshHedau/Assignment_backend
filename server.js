const app = require("./app");
require("dotenv").config();
const User = require("./models/user.model"); 
const Course = require("./models/course.model");
require("./models/user.model");
const { connectDB, sequelize } = require("./dbConfig/dbConnection");

const server = require("http").createServer(app);

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    server.listen(PORT, () => {
      console.log("Server is running on port", PORT);
    });
    await connectDB(); 
    console.log("Connected to DB");
    
    await sequelize.sync({alter:true});
    //await Course.sync({ alter: true }); // Sync Course model
    //await User.sync({ alter: true }); // Sync User model
    console.log("User and Course models synced successfully");
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
