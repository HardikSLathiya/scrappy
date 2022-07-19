const express = require("express");
const path = require("path");

const axios = require("axios");
const cheerio = require("cheerio");

const bodyParser = require("body-parser");
const expressValidator = require("express-validator");
const cors = require("cors");
const fs = require("fs");
const {validate} = require("./add-anime.validator");

const {validationResult} = require("express-validator/check");
const {body} = require("express-validator");

const baseUrl = "https://ww.9anime2.com";

const app = express();

// Configuring body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Configuring CORS
app.use(cors());

// API Endpoints
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

app.get("/api/v1/anime/get-list", function (req, res) {
    try {
        const fs = require("fs");

        let rawData = fs.readFileSync("src/app.constants.json");
        let animeList = JSON.parse(rawData);

        const result = {
            list: animeList,
            total: animeList.length,
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

app.post("/api/v1/anime/add", validate("addAnime"), function (req, res) {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({error: errors.array()});
            return;
        }

        const body = req.body;

        const fs = require("fs");

        let rawData = fs.readFileSync("src/app.constants.json");
        let animeList = JSON.parse(rawData);

        const isExist = animeList?.find((item) => item.id === body.id);

        if (isExist) {
            res.status(200).json({code: 1001, error: "Already Exist"});
        } else {
            const newAnime = {
                id: body.id,
                title: body.title,
                thumb: body.thumb,
            };
            animeList.push(newAnime);
            let content = JSON.stringify(animeList);
            fs.writeFile("src/app.constants.json", content, () => {
                res.status(200).json({
                    message: "Added Successfully"
                });
            });
        }

    } catch (e) {
        res.status(500);
        res.send({
            error: e.message,
            message: "Internal Server Error!"
        });
    }
});


app.post("/api/v1/anime/delete", validate("deleteAnime"), function (req, res) {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({error: errors.array()});
            return;
        }

        const body = req.body;

        const fs = require("fs");

        let rawData = fs.readFileSync("src/app.constants.json");
        let animeList = JSON.parse(rawData);

        const index = animeList?.findIndex((item) => item.id === body.id);

        if (index > -1) {
            animeList.splice(index, 1);
            let content = JSON.stringify(animeList);
            fs.writeFile("src/app.constants.json", content, () => {
                res.status(200).json({
                    message: "Deleted Successfully"
                });
            });
        } else {
            res.status(200).json({code: 1001, error: "Does Not Exist"});
        }

    } catch (e) {
        res.status(500);
        res.send({
            error: e.message,
            message: "Internal Server Error!"
        });
    }
});

// Configuring Public Pages
app.use("/", express.static("public"));
app.use("/anime", express.static("public"));
app.use("/anime/list", express.static("public"));
app.use("/anime/watch/:id", express.static("public"));
app.use("/anime/watch/:id/:episodeId", express.static("public"));

const server = app.listen(process.env.PORT || 8081, () => {
    console.log(`app running on port ${process.env.PORT || 8081}`);
});
