const streams = {}
const Datastore = require("nedb");
const path = require("path");
const {spawn} = require("child_process");
const axios = require("axios");
const dbPath = path.join(process.cwd(), 'data/db/StreamRecords.db')
const db = new Datastore({filename: dbPath, autoload: true})
const proxy = false
const host = '192.210.231.147'
const port = 6666


module.exports.db = db
module.exports.proxy = proxy
module.exports.host = host
module.exports.port = port
/**
 * 开始转播任务
 * @param url
 * @param stream
 * @param req
 * @param res
 */
module.exports.startStream = function (url, doc, res) {
    try {
        axios.post("https://stream1.mrdvh.com/index/api/addStreamProxy", {
            secret: '035c73f7-bb6b-4889-a715-d9eb2d1925cc',
            vhost: '__defaultVhost__',
            app: "stream",
            stream: doc.stream,
            url: url
        })
            .then(function (res1) {
            })
            .catch(function (error) {
                console.log(error)
            });
    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
    }
    try {
        let ffmpegParams = ['-i', url, '-c:v', 'copy', '-c:a', 'aac', '-f', 'flv', 'rtmp://127.0.0.1/stream/' + doc.stream]
        let task;
        if (true === proxy) {
            task = spawn('ffmpeg', ffmpegParams, {
                env: {
                    http_proxy: "http://" + host + ":" + port
                }
            });
        } else {
            task = spawn('ffmpeg', ffmpegParams);
        }
        task.on('error', () => {
            // catches execution error (bad file)
            console.log(`Error executing binary:`);
        });

        task.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        task.stderr.on('data', (data) => {
            console.log(data.toString());
        });
        task.on('close', (code) => {
            console.log(`Process exited with code: ${code}`);
        });
        streams[doc.url] = task
    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
    }
    if (null != res) {
        res.status(200)
        res.json({
            "code": 200, "msg": "添加转播任务成功", "url": "https://live.mrdvh.com/live?name=" + doc.stream
        })
    }
}

/**
 * 停止转播任务
 * @param doc
 * @param stream
 * @param res
 */
module.exports.stopStream = function (doc, res) {
    try {
        axios.post("https://stream1.mrdvh.com/index/api/delStreamProxy", {
            secret: '035c73f7-bb6b-4889-a715-d9eb2d1925cc',
            key: "__defaultVhost__/stream/" + doc.stream
        })
            .then(function (res1) {
            })
            .catch(function (error) {
                console.log(error)
            });
    } catch (e) {

    }
    doc.deleted = true
    db.update({stream: doc.stream}, doc)
    const task = streams[doc.url]
    if (task) {
        task.kill(0)
    }
    delete streams[doc.url]
    db.remove({stream: doc.stream})
    if (null != res) {
        res.status(200)
        res.json({"code": 200, "msg": "停止转播成功"})
    }
}