import dotenv from "dotenv"
import db from './database/db.js';
import {app} from './app.js'
dotenv.config({
    path: './.env'
})

//console.log(`${process.env.DB_NAME}`);


db()
.then(() => {
    console.log("mongodb connection successfully")
})
.catch((err) => {
    console.log(" mongodb connection failed !!! ", err);
})