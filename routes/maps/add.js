const express = require('express');
const router = express.Router();
const pool = require('../../dbConnection');
const CONFIG = require("../../config.json");
const {validateAccessToken} = require("../../handlers/validateToken");
const {checkRequiredPermissions} = require("../../handlers/permissionCheck");
const axios = require("axios");
const formidable = require("formidable");
const form = formidable({ multiples: true});

router
    .post('/', validateAccessToken, checkRequiredPermissions(["addMaps"]), async function(req, res) {
        form.parse(req, async (err, fields) => {
            let mapid = fields.id;
            let mapname = fields.name;
            let mappoints = fields.points;
            let mapscore = fields.score;
            let mapstatus = fields.status;
            let mapimage = fields.image;
            let mapauthor = fields.author;
            let mapnominator = fields.nominator;

            let mappp = Math.round(parseFloat(mappoints) * 0.08 * 2 * 100 * 100) / 100;

            let conn, mapauthorname;

            try {
                conn = await pool.getConnection();
                await conn.query("INSERT INTO `maps` (`id`, `name`, `points`, `pp`, `score`, `status`, `image`, `author`) VALUES ('" + mapid + "', '" + mapname + "', '" + mappoints + "', '" + mappp + "', '" + mapscore + "', '" + mapstatus + "', '" + mapimage + "', '" + mapauthor + "');");
                let player = await conn.query("SELECT * FROM `players` where id='" + mapauthor + "';");

                if(player[0] === undefined) {
                    mapauthorname = mapauthor;
                } else {
                    mapauthorname = player[0].name;
                }
            } catch(err) {
                console.log(err);
            } finally {
                if(conn) {
                    await conn.end();
                }
            }

            let embeds = [
                {
                    title: `New official map`,
                    url: CONFIG.websiteBaseUrl + "/map/" + mapid,
                    color: 5174599,
                    thumbnail: {
                        url: mapimage
                    },
                    description: `**${mapname}**\n`
                        + `Difficulty: ${mappoints}\n`
                        + `PP: ${mappp}pp\n`
                        + `Max Score: ${mapscore.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n`
                        + `Status: ${mapstatus}\n`
                        + `Author: [${mapauthorname}](${CONFIG.websiteBaseUrl}/profile/${mapauthor})\n`
                        + `Nominated by: ${mapnominator}`
                },
            ];

            let data = JSON.stringify({ embeds });

            const config = {
                method: "POST",
                url: CONFIG.webhookUrl,
                headers: { "Content-Type": "application/json" },
                data: data,
            };

            await axios(config)
                .then()
                .catch((error) => {
                    console.log(error);
                });
        });
        res.send("Map added");
    });

module.exports = router;