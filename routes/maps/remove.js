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
    .post('/', validateAccessToken, checkRequiredPermissions(["removeMaps"]), async function(req, res) {
        form.parse(req, async (err, fields) => {
            let removeReason = fields.removeReason;
            let removedBy = fields.removedBy;
            let mapId = fields.mapId;
            let mapName = fields.mapName;
            let mapImage = fields.mapImage;

            let conn;

            try {
                conn = await pool.getConnection();
                await conn.query("DELETE FROM `maps` WHERE id='" + mapId + "'");
                await conn.query("DELETE FROM `scores` WHERE map_id='" + mapId + "'");
            } catch(err) {
                console.log(err);
            } finally {
                if(conn) {
                    await conn.end();
                }
            }

            let embeds = [
                {
                    title: `Map removed`,
                    color: 15548997,
                    thumbnail: {
                        url: mapImage
                    },
                    description: `**${mapName}**\n`
                        + `Reason: ${removeReason}\n`
                        + `Removed by: ${removedBy}`
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

        res.send("Map removed");
    });

module.exports = router;