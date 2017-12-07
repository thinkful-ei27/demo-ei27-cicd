'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config');
const { Restaurant } = require('./models');

const app = express();
app.use(bodyParser.json());

app.get('/restaurants', (req, res) => {
  Restaurant
    .find()
    .limit(10)
    .then(restaurants => {
      // res.json({restaurants: [{},{},{},]});
      res.json({
        restaurants: restaurants.map(
          (restaurant) => restaurant.apiRepr())
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

app.get('/restaurants/:id', (req, res) => {
  Restaurant
    .findById(req.params.id)
    .then(restaurant => res.json(restaurant.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

app.post('/restaurants', (req, res) => {
  Restaurant
    .create({
      name: req.body.name,
      borough: req.body.borough,
      cuisine: req.body.cuisine,
      grades: req.body.grades,
      address: req.body.address
    })
    .then(
      restaurant => res.status(201).json(restaurant.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});


app.put('/restaurants/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`);
    console.error(message);
    res.status(400).json({ message: message });
  }

  const toUpdate = {};
  const updateableFields = ['name', 'borough', 'cuisine', 'address'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Restaurant
    .findByIdAndUpdate(req.params.id, { $set: toUpdate })
    .then( () => res.status(204).end())
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

app.delete('/restaurants/:id', (req, res) => {
  Restaurant
    .findByIdAndRemove(req.params.id)
    .then( () => res.status(204).end())
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

app.use('*', function (req, res) {
  res.status(404).json({ message: 'Not Found' });
});

let server;
function runServer(databaseUrl = DATABASE_URL, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, {useMongoClient: true}, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
