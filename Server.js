const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

app.get("/health",(req,res)=>{
    res.status(200).send("Server is healthy");
})


app.listen((process.env.PORT), () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});