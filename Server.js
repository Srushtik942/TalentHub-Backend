const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();
const router = express.Router();
const {initializeDb} = require("./db/db.connect");
const authRoutes = require("./helperFunctions/Auth");
const {requireAuth} = require("./auth/auth");
dotenv.config();
app.use(cors());
app.use(express.json());

app.get("/health",(req,res)=>{
    res.status(200).send("Server is healthy");
})

app.use("/api/auth",authRoutes);


async function startServer(){
    try{
        await initializeDb();
        app.listen((process.env.PORT), () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
    }catch(err){
        console.log("Error starting server:", err);
        process.exit(1);
    }
}

app.listen(process.env.PORT, async () => {
    await startServer();
})