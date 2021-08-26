var express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
var app = express();
const admin = require("firebase-admin");
require("dotenv").config();

const { MongoClient } = require("mongodb");

app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./configs/cineplan-319-firebase-adminsdk-g8jmm-d477d78054.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lvals.mongodb.net/cinePlan-Ticket?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const ticketCollection = client
    .db("cinePlan-Ticket")
    .collection("buyTickets");
  app.post("/buyTicket", (req, res) => {
    const newBuyTicket = req.body;
    ticketCollection.insertOne(newBuyTicket).then((result) => {
      res.send(result.acknowledged);
    });
  });
  app.get("/buying", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          if (tokenEmail === req.query.email) {
            ticketCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              });
          } else {
            res.status(401).send("Unauthorized Access");
          }
        })
        .catch((error) => {
          res.status(401).send("Unauthorized Access");
        });
    } else {
      res.status(401).send("Unauthorized Access");
    }
  });
});

app.get("/", function (req, res) {
  res.send("hello world");
});

app.listen(8000);
