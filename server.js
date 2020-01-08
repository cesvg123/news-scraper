var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

var Note = require("./src/models/Note");
var Article = require("./src/models/Article");

var request = require("request");
var cheerio = require("cheerio");

var PORT = process.env.PORT || 3000;

var app = express();
app.use(logger("dev"));

app.use(express.urlencoded({
    extended: false
}));

app.use(express.json());
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/news-scraper";

mongoose.connect(MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
});

var exphbs = require('express-handlebars');
app.engine("handlebars", exphbs({
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "/views/layouts/"),
    partialsDir: path.join(__dirname, "/views/")
}));
app.set("view engine", "handlebars");

app.use(express.static("./src/public/"))

app.get("/", function (req, res) {
    Article.find({
        "saved": false
    }).limit(10).exec(function (error, data) {
        var hbsObject = {
            article: data
        };
        console.log(hbsObject);
        res.render("home", hbsObject);
    });
});

app.get("/scrape", function (req, res) {
    request("https://www.nytimes.com/", function (error, response, html) {
        var $ = cheerio.load(html);
        $("article").each(function (i, element) {
            var result = {};
            result.title = $(this).find("h2").text();
            result.link = "https://www.nytimes.com" + $(this).find("a").attr("href");
            result.summary = $(this).find("p").text();


            var entry = new Article(result);

            entry.save(function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(doc);
                }
            });
        });
        res.send("Process completed");
    });
});


app.get("/saved", function (req, res) {
    Article.find({
        "saved": true
    }).populate("notes").exec(function (error, articles) {
        var hbsObject = {
            article: articles
        };
        res.render("saved", hbsObject);
    });
});

app.get("/articles", function (req, res) {
    Article.find({}).limit(10).exec(function (error, doc) {
        if (error) {
            console.log(error);
        } else {
            res.json(doc);
        }
    });
});

app.post("/articles/save/:id", function (req, res) {
    Article.findOneAndUpdate({
            "_id": req.params.id
        }, {
            "saved": true
        })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                console.log(doc);
                res.send(doc);
            }
        });
});

app.get("/articles/:id", function (req, res) {
    Article.findOne({
            "_id": req.params.id
        })
        .populate("note")
        .exec(function (error, doc) {
            if (error) {
                console.log(error);
            } else {
                res.json(doc);
            }
        });
});

app.post("/articles/delete/:id", function (req, res) {
    Article.findOneAndUpdate({
            "_id": req.params.id
        }, {
            "saved": false,
            "notes": []
        })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                console.log(doc);
                res.send(doc);
            }
        });
});

app.post("notes/save/:id", function (req, res) {
    var newNote = new Note({
        body: req.body.text,
        article: req.params.id
    });
    console.log(req.body)
    newNote.save(function (error, note) {
        if (error) {
            console.log(error);
        } else {
            Article.findOneAndUpdate({
                    "_id": req.params.id
                }, {
                    $push: {
                        "notes": note
                    }
                })
                .exec(function (err) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        res.send(note);
                    }
                });
        }
    });
});

app.delete("/notes/delete/:note_id/:article", function (req, res) {
    Note.findOneAndRemove({
        "_id": req.params.note.id
    }, function (err) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            Article.findOneAndUpdate({
                    "_id": req.params.article_id
                }, {
                    $pull: {
                        "notes": req.params.note_id
                    }
                })
                .exec(function (err) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        res.send("Note Deleted");
                    }
                });
        }
    });
});

app.listen(PORT, function () {
    console.log("App running on PORT: " + PORT);
});