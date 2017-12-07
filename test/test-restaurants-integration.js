'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { Restaurant } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');
const seedData = require('./seedData');

const should = chai.should();
chai.use(chaiHttp);


before(function () {
  return runServer(TEST_DATABASE_URL);
});

beforeEach(function () {
  return Restaurant.insertMany(seedData);
});

afterEach(function () {
  return mongoose.connection.dropDatabase();
});

after(function () {
  return closeServer();
});

describe('GET endpoint', function () {
  let res;
  it('should return all existing restaurants', function () {
    return chai.request(app)
      .get('/restaurants')
      .then(function (temp) {
        res = temp;
        res.should.have.status(200);
        res.should.be.json;
        res.body.restaurants.should.be.a('array');
        res.body.restaurants.should.have.length.of.at.least(1);
        return Restaurant.count();
      })
      .then(function (count) {
        res.body.restaurants.should.have.length.of(count);
      });
  });

  it('should return restaurants with right fields', function () {
    let resRestaurant;
    return chai.request(app)
      .get('/restaurants')
      .then(function (res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.restaurants.should.be.a('array');
        res.body.restaurants.should.have.length.of.at.least(1);

        res.body.restaurants.forEach(function (restaurant) {
          restaurant.should.be.a('object');
          restaurant.should.include.keys(
            'id', 'name', 'cuisine', 'borough', 'grade', 'address');
        });
        resRestaurant = res.body.restaurants[0];
        return Restaurant.findById(resRestaurant.id);
      })
      .then(function (restaurant) {
        resRestaurant.id.should.equal(restaurant.id);
        resRestaurant.name.should.equal(restaurant.name);
        resRestaurant.cuisine.should.equal(restaurant.cuisine);
        resRestaurant.borough.should.equal(restaurant.borough);
        resRestaurant.address.should.contain(restaurant.address.building);
        resRestaurant.grade.should.equal(restaurant.grade);
      });
  });
});

describe('POST endpoint', function () {
  it.only('should add a new restaurant', function () {
    const newRestaurant = {
      'name': 'Test Restaurant',
      'borough': 'Brooklyn',
      'cuisine': 'jamaican',
      'address': {
        'building': '123',
        'street': 'Man st',
        'zipcode': '12345'
      },
      'grades': [
        {
          'date': '2017-05-15T18:34:10.847Z',
          'grade': 'A'
        },
        {
          'date': '2017-04-29T03:30:15.836Z',
          'grade': 'A'
        },
        {
          'date': '2017-08-14T10:22:28.453Z',
          'grade': 'A'
        }
      ]
    };
    let mostRecentGrade;

    return chai.request(app)
      .post('/restaurants')
      .send(newRestaurant)
      .then(function (res) {
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.include.keys(
          'id', 'name', 'cuisine', 'borough', 'grade', 'address');
        res.body.name.should.equal(newRestaurant.name);
        res.body.id.should.not.be.null;
        res.body.cuisine.should.equal(newRestaurant.cuisine);
        res.body.borough.should.equal(newRestaurant.borough);

        mostRecentGrade = newRestaurant.grades.sort(
          (a, b) => b.date - a.date)[0].grade;
        res.body.grade.should.equal(mostRecentGrade);
        return Restaurant.findById(res.body.id);
      })
      .then(function (restaurant) {
        restaurant.name.should.equal(newRestaurant.name);
        restaurant.cuisine.should.equal(newRestaurant.cuisine);
        restaurant.borough.should.equal(newRestaurant.borough);
        restaurant.grade.should.equal(mostRecentGrade);
        restaurant.address.building.should.equal(newRestaurant.address.building);
        restaurant.address.street.should.equal(newRestaurant.address.street);
        restaurant.address.zipcode.should.equal(newRestaurant.address.zipcode);
      });
  });
});

describe('PUT endpoint', function () {
  it('should update fields you send over', function () {
    const updateData = {
      id: undefined,
      name: 'TEST TEST TEST',
      cuisine: 'futuristic fusion'
    };
    return Restaurant.findOne()
      .then(function (restaurant) {
        updateData.id = restaurant.id;
        return chai.request(app)
          .put(`/restaurants/${restaurant.id}`)
          .send(updateData);
      })
      .then(function (res) {
        res.should.have.status(204);
        return Restaurant.findById(updateData.id);
      })
      .then(function (restaurant) {
        restaurant.name.should.equal(updateData.name);
        restaurant.cuisine.should.equal(updateData.cuisine);
      });
  });
});

describe('DELETE endpoint', function () {
  it('delete a restaurant by id', function () {
    let restaurant;
    return Restaurant
      .findOne()
      .then(function (temp) {
        restaurant = temp;
        return chai.request(app).delete(`/restaurants/${restaurant.id}`);
      })
      .then(function (res) {
        res.should.have.status(204);
        return Restaurant.findById(restaurant.id);
      })
      .then(function (results) {
        should.not.exist(results);
      });
  });
});
