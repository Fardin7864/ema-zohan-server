const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

//middlewares
app.use(express.json());
app.use(cors());

app.get('/',async (req,res) => { 
    res.send("Ema-zohan Server is runnig!")
 })



app.listen(port, () => { 
    console.log(`Server is runnig on port: ${port}`)
 })