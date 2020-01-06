var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

var PORT = process.env.PORT || 3000;

var app = express();
app.use.(logger(dev));

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static("./src/public/"));

var {reviews, api} = require("./src/controllers/index");
app.use("/reviews", reviews);
app.use("/api", api);

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/news-scraper";

mongoose.connect(MONGODB_URI, {
useUnifiedTopology: true,
useNewUrlParser: true,
useFindAndModify: false
});
app.listen(PORT, () => {
console.log(`app listening on locahost/${PORT}`);
});