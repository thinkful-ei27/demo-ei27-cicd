'use strict';
const mongoose = require('mongoose');

const restaurantSchema = mongoose.Schema({
  name: {type: String, required: true},
  borough: {type: String, required: true},
  cuisine: {type: String, required: true},
  address: {
    building: String,
    coord: [String],
    street: String,
    zipcode: String
  },
  grades: [{
    date: Date,
    grade: String,
    score: Number
  }]
});

restaurantSchema.virtual('addressString').get(function() {
  return `${this.address.building} ${this.address.street}`.trim();});

restaurantSchema.virtual('grade').get(function() {
  const gradeObj = this.grades.sort((a, b) => {return b.date - a.date;})[0] || {};
  return gradeObj.grade;
});

restaurantSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    name: this.name,
    cuisine: this.cuisine,
    borough: this.borough,
    grade: this.grade,
    address: this.addressString
  };
};

const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);

module.exports = {Restaurant};
