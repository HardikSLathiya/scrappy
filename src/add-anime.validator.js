const {body} = require("express-validator/check");

exports.validate = (method) => {
    switch (method) {
        case "addAnime": {
            return [
                body("id", "Id doesn't exists").exists(),
                body("title", "title doesn't exists").exists(),
                body("thumb", "thumb doesn't exists").exists(),
            ];
        }
        case "deleteAnime": {
            return [
                body("id", "Id doesn't exists").exists(),
            ];
        }
    }
};
