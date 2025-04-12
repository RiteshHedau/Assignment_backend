const app = require("./app");
require("dotenv").config();
const User = require("./models/user.model");
const Course = require("./models/course.model");
require("./models/user.model");
const { connectDB, sequelize } = require("./dbConfig/dbConnection");

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.CLIENT_URL,
   // methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    //allowedHeaders: ["Content-Type", "Authorization"],
  },
 // pingTimeout: 60000,
 // pingInterval: 25000,
});

// Add socket.io connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Authenticate socket connection
  // const token = socket.handshake.auth.token;
  // if (token) {
  //   console.log("Client authenticated:", socket.id);
  // }

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected:", socket.id, "Reason:", reason);
  });

  socket.on("error", (error) => {
    console.error("Socket error for client:", socket.id, error);
  });
});

// Make io accessible globally
app.set("io", io);

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    server.listen(PORT, () => {
      console.log("Server is running on port", PORT);
    });
    await connectDB();

    await sequelize.sync({ alter: false });
    //await Course.sync({ alter: true }); // Sync Course model
    //await User.sync({ alter: true }); // Sync User model
    console.log("User and Course models synced successfully");
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
