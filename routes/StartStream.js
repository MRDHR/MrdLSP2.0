const express = require("express");
const {exec} = require("child_process");
const md5 = require('md5-node');
const router = express.Router();
const db = require("../utils/StreamsManager").db
const streamManager = require("../utils/StreamsManager")
const validator = require("validator");
const proxy = require("../utils/StreamsManager").proxy
const host = require("../utils/StreamsManager").host
const port = require("../utils/StreamsManager").port

router.post("*", (req, res, next) => {
    if (req.body) {
        let url = req.body.url
        const stream = md5(req.body.p + req.body.name)

        if (url && stream) {
            db.find({url: url}, {multi: false}, function (err, docs) {
                if (0 === docs.length) {
                    //没有该url的记录
                    const doc = {
                        url: url, stream: stream, deleted: false
                    }
                    db.insert(doc, function (err, newDoc) {
                        if (null == err) {
                            //保存成功
                            if (-1 !== url.indexOf(".m3u8")) {
                                //已经是m3u8，不走解析了
                                if (url.endsWith("\n")) {
                                    url = url.replace("\n", "")
                                }
                                streamManager.startStream(url, doc, res);
                            } else {
                                if (-1 !== url.indexOf("twitcasting") && -1 !== url.indexOf("?")) {
                                    url = url.substring(0, url.lastIndexOf("?"))
                                }
                                let ytDlpCmd = "yt-dlp --dump-json " + url
                                if (true === proxy) {
                                    ytDlpCmd = "yt-dlp --dump-json --proxy http://" + host + ":" + port + " " + url
                                }
                                exec(ytDlpCmd, function (error, stdout, stderr) {
                                    if (validator.isJSON(stdout)) {
                                        //是json数据
                                        const videoInfo = JSON.parse(stdout)
                                        if (null != videoInfo) {
                                            if (videoInfo.is_live) {
                                                //直播中
                                                doc['title'] = videoInfo.fulltitle
                                                doc['cover'] = videoInfo.thumbnail.replace("i.ytimg.com", "res.mrdvh.com")
                                                db.update({stream: doc.stream}, doc)
                                                const formats = videoInfo.formats;
                                                let confirmUrl;
                                                for (let i = formats.length - 1; i > 0; i--) {
                                                    if (-1 !== formats[i].url.indexOf("twitcasting.tv") && "mp4" === formats[i].video_ext) {
                                                        confirmUrl = formats[i].url;
                                                        break
                                                    } else if ((formats[i].width < 1080 || formats[i].height < 1080)
                                                        && "mp4" === formats[i].video_ext) {
                                                        confirmUrl = formats[i].url;
                                                        break
                                                    }
                                                }
                                                if (null != confirmUrl) {
                                                    streamManager.startStream(confirmUrl, doc, res);
                                                }
                                            } else {
                                                //未直播
                                                res.status(500)
                                                res.json({
                                                    "code": 500, "msg": "未直播"
                                                })
                                            }
                                        } else {
                                            //未直播
                                            res.status(500)
                                            res.json({
                                                "code": 500, "msg": "未直播"
                                            })
                                        }
                                    } else {
                                        //错误，没直播的状态
                                        res.status(500)
                                        res.json({
                                            "code": 500, "msg": "未直播"
                                        })
                                    }
                                })
                            }
                        } else {
                            //保存失败
                            res.status(500)
                            res.json({
                                "code": 500, "msg": "记录保存失败"
                            })
                        }
                    })
                } else {
                    //已有该url的记录
                    res.status(500)
                    res.json({
                        "code": 500, "msg": "请勿重复提交"
                    })
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
