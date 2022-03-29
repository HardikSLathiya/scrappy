const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const port = 3000;
const baseUrl = "https://ww.9anime2.com";

app.get("/api/v1/anime/get/:id", function (req, res) {
    const url = baseUrl + "/watch/" + req.params.id;
    console.log(url);
    axios.get(url).then((response) => {
        const html = response.data;

        if (!html) {
            res.status(400);
            res.send({
                message: "Entity not found!"
            });
        }

        try {
            const $ = cheerio.load(html);
            const result = {
                urls: [],
                total: 0,
                info: {}
            };

            // extract episodes list
            const episodes = $("#episodes ul").children();
            result.total = episodes.length || 0;
            for (let i = 0; i < result.total; i++) {
                result.urls.push(episodes[i].children[0].attribs.href);
            }

            // extract info
            const $info = cheerio.load($("#info").html());

            // thumbnail
            const thumb = $info(".thumb").children();
            if (thumb.find("img").length) {
                result.info.thumb = baseUrl + thumb.find("img")[0].attribs.src;
            }

            // title, alias, description & meta
            result.info.title = $info(".info > .title").html();
            result.info.alias = $info(".info > .alias").html();
            result.info.description = $info(".info > .shorting").html();
            result.info.meta = $info(".info > .meta").html();

            res.status(200);
            res.send(result);
        } catch (e) {
            res.status(500);
            res.send({
                error: e.message,
                message: "Internal Server Error!"
            });
        }
    });
});

app.get("/api/v1/anime/get-episode/:id/:episodeId", function (req, res) {
    const url = baseUrl + "/watch/" + req.params.id + "/" + req.params.episodeId;
    console.log(url);
    axios.get(url).then((response) => {
        const html = response.data;

        if (!html) {
            res.status(400);
            res.send({
                message: "Entity not found!"
            });
        }

        try {
            const $ = cheerio.load(html);
            const playerNode = $("#player").children("#playerframe");
            const src = playerNode[0].attribs.src;
            const result = {
                url: baseUrl + src,
            };
            res.status(200);
            res.send(result);
        } catch (e) {
            res.status(500);
            res.send({
                error: e.message,
                message: "Internal Server Error!"
            });
        }
    });
});

app.listen(port, () => {
    console.log(`app running on port ${port}`);
});
