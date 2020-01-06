var express = require("express");
var {Album, Review} = require ("../models")

module.exports = (() => {
var reviews = express.Router();
reviews.get("/", (req, res) =>{
Review.find({})
.then(data =>{
    res.json(data)
})
.catch(err => res.json(err))
})
return reviews;
})();