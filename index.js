const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
var admin = require('firebase-admin');

const app = express();

app.use(bodyParser.json());
app.use(cors());

var serviceAccount = require("./config/city-ride-925bb-firebase-adminsdk-kfwge-f73cc01110.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_PASS}:${process.env.DB_USER}@cluster0.cb3vq.mongodb.net/stuffData?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/', (req, res) => {
    res.send('Hello world !')
})

client.connect(err => {
    const collection = client.db("Burj-al-arab").collection("bookings");
    // post bookings data to database
    app.post('/addBookings', (req, res) => {
        collection.insertOne(req.body)
            .then(result => {
                res.send(result.acknowledged === true)
            })
    })


    app.get('/bookings', (req, res) => {

        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1]
            console.log(idToken)
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    
                    if (tokenEmail == queryEmail) {
                        collection.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.send(documents)
                            })
                    } else {
                        res.status(401).send('Unauthorized user')
                    }
                })
                .catch((error) => {
                    res.status(401).send('Unauthorized user')
                });
        }
        else {
            res.status(401).send('Unauthorized user')
        }

        console.log(req.query.email)
        console.log(req.headers.authorization)
        collection.find({ email: req.query.email })
            .toArray((err, documents) => {
                res.send(documents)
            })
    })
})

app.listen(4000, () => console.log('Server listening on port 4000'))