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
            let mapid = fields.mapId;
            let mapname = fields.name;
            let mappoints = fields.points;
            let mapscore = fields.score;
            let mapstatus = fields.status;
            let mapimage = fields.image;

            let mappp = 0.0;

            if(mappoints !== "") {
                mappp = Math.round(parseFloat(mappoints) * 0.08 * 2 * 100 * 100) / 100;
            }

            let conn, oldMap;
            let embedFields = [];

            try {
                conn = await pool.getConnection();
                let oldMapRaw = await conn.query("SELECT * FROM `maps` WHERE id = '" + mapid + "'");
                oldMap = oldMapRaw[0];

                let updateQuery = "";

                if(mapname !== "" && mapname !== oldMap.name) {
                    updateQuery += "name = '" + mapname + "', ";
                    embedFields.push({
                        name: "Name",
                        value: `Old: ${oldMap.name}\nNew: ${mapname}`,
                        inline: true,
                    });
                }

                if(mappoints !== "" && mappoints !== oldMap.points) {
                    updateQuery += "points = '" + mappoints + "', ";
                    embedFields.push({
                        name: "Points",
                        value: `Old: ${oldMap.points}\nNew: ${mappoints}`,
                        inline: true,
                    });
                }

                if(mapscore !== "" && mapscore !== oldMap.score) {
                    updateQuery += "score = '" + mapscore + "', ";
                    embedFields.push({
                        name: "Score",
                        value: `Old: ${oldMap.score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\nNew: ${mapscore.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
                        inline: true,
                    });
                }

                if(mapstatus !== "" && mapstatus !== oldMap.status) {
                    updateQuery += "status = '" + mapstatus + "', ";
                    embedFields.push({
                        name: "Status",
                        value: `Old: ${oldMap.status}\nNew: ${mapstatus}`,
                        inline: true,
                    });
                }

                if(mapimage !== "" && mapimage !== oldMap.image) {
                    updateQuery += "image = '" + mapimage + "', ";
                    embedFields.push({
                        name: "Image",
                        value: `Old: ${oldMap.image}\nNew: ${mapimage}`,
                        inline: true,
                    });
                }

                if(mappp !== 0.0 && mappp !== parseFloat(oldMap.pp)) {
                    updateQuery += "pp = '" + mappp + "', ";
                    embedFields.push({
                        name: "PP",
                        value: `Old: ${oldMap.pp}pp\nNew: ${mappp}pp`,
                        inline: true,
                    });
                }

                if(updateQuery === "") {
                    res.send("No changes");
                    return;
                }

                updateQuery = updateQuery.substring(0, updateQuery.length - 2);

                await conn.query("UPDATE `maps` SET " + updateQuery + " WHERE id = '" + mapid + "';");
            } catch(err) {
                console.log(err);
            } finally {
                if(conn) {
                    await conn.end();
                }
            }

            let embeds = [
                {
                    title: `Map Update`,
                    url: CONFIG.websiteBaseUrl + "/map/" + mapid,
                    color: 16776960,
                    thumbnail: {
                        url: mapimage === "" ? oldMap.image : mapimage,
                    },
                    description: `The following values have changed for \`\`\`${oldMap.name}\`\`\``,
                    fields: embedFields,
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
        res.send("Map edited");
    });

module.exports = router;