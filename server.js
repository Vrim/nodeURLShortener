"use strict";
require("dotenv").config();
var express = require("express");
var mongoose = require("mongoose");
var bp = require("body-parser");
var nodeUri = require("node-uri");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(process.env.MONGO_URI);
console.log(process.env.MONGO_URI);
var Schema = mongoose.Schema;
var urlSchema = new Schema({
  original_url: String, // String is shorthand for {type: String}
  short_url: Number,
});
var Url = mongoose.model("Url", urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bp.urlencoded({ extended: false }));
app.use("/public", express.static(process.cwd() + "/public"));

app.get(process.env.ROOT_DIR, function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.post(process.env.ROOT_DIR + "/api/new", async function (req, res) {
  var original_url = req.body.url;
  console.log(original_url);

  try {
    nodeUri.checkWebURL(original_url);    
    console.log("Looks like an web URL");
  } catch (err) {
    console.log("Not a URI");
    return res.json({ error: "invalid web URL." });
  }
  
  try {
    await Url.findOne({ original_url: original_url }, function (err, data) {
      if (err) {
        console.log("nope");
        res.end();
        return console.log(err);
      } else {
        if (data) {
          console.log("exists");
          var num_ = data.get("short_url");
          console.log(data);
          return res.json({
            original_url: original_url,
            short_url: num_,
          });
        }
      }
    });

    var num = await Url.find().countDocuments(function (err, count) {
      if (err) return console.log(err);
      num = parseInt(count);
    });
    var url = new Url({
      original_url: original_url,
      short_url: num,
    });
    await url.save(function (err, done) {
      if (err) {
        return res.json({
          code: 500,
          message: "" + err,
        });
      }
      res.json({
        original_url: original_url,
        short_url: num,
      });
      var mongo = require("mongodb");
    });
  } catch {
    console.log("error with connection");
    return res.json({
      code: 500,
      message: "error with connection",
    });
  }
});

app.get(process.env.ROOT_DIR + "/api/new", function (req, res) {
  res.redirect(process.env.ROOT_DIR);
});

app.get(process.env.ROOT_DIR + "/api/:num", function (req, res) {
  var num = req.params.num;
  console.log(num);
  if (isNaN(num)) {
    res.json({
      error: "Shorturl does not exist. '" + num + "' is not a number.",
    });
  } else {
    num = parseInt(num);
    Url.findOne({ short_url: num }, function (err, data) {
      if (err) {
        res.json({
          error: "" + err,
          code: 500,
          message: "Shorturl does not exist.",
        });
        return console.log(err);
      } else {
        var url_ = data.get("original_url");
        console.log(url_);
        res.redirect(url_);
      }
    });
  }
});

app.listen(port, function () {
  console.log("Node.js listening ...");
});
