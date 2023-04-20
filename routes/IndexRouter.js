const express = require("express");
const router = express.Router();
const db = require("../utils/StreamsManager").db

router.get("", (req, res, next) => {
    res.render("index");
});
router.get("/index", (req, res, next) => {
    res.render("index");
});

router.get("/index/getStreams", (req, res, next) => {
    db.find({}, {multi: true}, function (err, docs) {
        res.json(docs)
    })
});

module.exports = router;