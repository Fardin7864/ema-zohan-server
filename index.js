const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
var cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7k1zdza.mongodb.net/?retryWrites=true&w=majority`;

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors(
    {
        origin: ['http://localhost:5173','https://chat-app-1bf83.web.app'],
        credentials: true,
        methods: ["GET", "POST", "DELETE", "UPDATE"]
    }
));

//custom middlewares
const verify = (req, res, next) => { 
    const token = req.cookies['ema-zohan'];
    if (!token) {
        return res.status(401).send({ message: "unauthorized" });
      }
    jwt.verify(token,process.env.API_SECRET_KEY,(err, decoded) => { 
        if (err) {
          res.status(401).send("Forbbiden!");
        }
        // console.log(decoded.email)
        res.user = decoded;
        next();
     })
 }

// app.use(verify)

app.get("/", async (req, res) => {
  res.send("Ema-zohan Server is runnig!");
});

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    //collection
    const productsColl = client.db("ema-zohan").collection("products");
    const cartColl = client.db("ema-zohan").collection("cart");

    //Auth related api
    app.post('/jwt',async (req,res) => {
        const email = req.body.email
        // console.log(email)
        const token =  jwt.sign({email}, process.env.API_SECRET_KEY,{expiresIn: '1h'})
        try {
            // console.log(token);
            res
            .cookie('ema-zohan', token,{httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'})
            .send(token)
        } catch (error) {
            
        }
     })

    //Get all products
    app.get("/products", async (req, res) => {
      try {
        const result = await productsColl.find().toArray();
        res.send(result);
      } catch (error) {
        // console.log(error);
        res.send("Server Error");
      }
    });
    //api for loading product for pagination
    app.get("/productsByCount", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      try {
        // console.log(page, 'and' , size)
        const result = await productsColl
          .find()
          .skip(page * size)
          .limit(size)
          .toArray();
        res.send(result);
      } catch (error) {
        // console.log(error);
        res.status(500).send("Server Error!");
      }
    });
    //get data from cart
    app.get("/cart",verify, async (req, res) => {
      try {
        const result = await cartColl.find().toArray();
        res.send(result);
      } catch (error) {
        // console.log(error);
        res.status(500).send("Server Error!");
      }
    });
    //add to cart
    app.post("/cart", async (req, res) => {
      try {
        const product = req.body;
        const result = await cartColl.insertOne(product);
        res.send(result);
      } catch (error) {
        // console.log(error);
        res.status(500).send("Server Error!");
      }
    });
    //Delete from cart
    app.delete("/cart/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await cartColl.deleteOne(query);
        res.status(200).send(result);
      } catch (error) {
        // console.log(error);
        res.status(500).send("Server Error!");
      }
    });
    //Find cart data
    app.get('/cartData',verify, async (req,res) => { 
        // console.log('from cartdata:',res.user)
        const email = req.query.email;
        if (res.user.email !== email) {
             res.send('Unauthorized')
        }
        try {
        const query = {email: email};
        const result = await cartColl.find(query).toArray();
        res.send(result)
        } catch (error) {
          //  console.log(error);
           res.status(500).send('Server error!') 
        }
     })
    
    //total data count
    app.get('/productsCounts', async (req,res) => { 
        try {
        const count = await productsColl.countDocuments()
        if (count === null) {
            throw new Error('Count is null');
          }
        // console.log(count)
        res.send({count})
        } catch (error) {
            // console.log(error);
            res.status(500).send('server error');
        }
     })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  // console.log(`Server is runnig on port: ${port}`);
});
