const express = require("express");
const md5 = require('md5-node');
const router = express.Router();
const db = require("../utils/StreamsManager").db
const streamManager = require("../utils/StreamsManager")
router.post("*", (req, res, next) => {
    if (req.body) {
        const stream = md5(req.body.p + req.body.name)
        if (stream) {
            db.find({stream: stream}, {multi: false}, function (err, docs) {
                if (0 === docs.length) {
                    res.status(500)
                    res.json({"code": 500, "msg": "未找到该记录"})
                } else {
                    streamManager.stopStream(docs[0], res)
                }
            })
        } else {
            res.status(404)
            res.json({"code": 404, "message": "未找到该页面"})
        }
    } else {
        res.status(404)
        res.json({"code": 404, "message": "未找到该页面"})
    }
});

module.exports = router;
