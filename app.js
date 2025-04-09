const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const userRoutes= require('./routes/user.route')
const courseRoutes= require('./routes/course.route')

const app = express();
const corsOptions = {
    origin: '*', 
    credentials: true, 
};



app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/users',userRoutes);
app.use('/courses',courseRoutes);



module.exports = app;