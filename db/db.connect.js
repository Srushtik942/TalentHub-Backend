const mongoose = require("mongoose");
require("dotenv").config();

const mongoUri = process.env.MONGO_URI;

const initializeDb = async()=>{
   await mongoose.connect(mongoUri).then(()=>{
    console.log("Database connected successfully");
   }).catch((err)=>{
    console.error("Error connecting to database:", err);
   })
}

module.exports = {initializeDb};