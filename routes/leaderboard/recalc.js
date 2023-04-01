const express = require('express');
const router = express.Router();
const pool = require("../../dbConnection");
const {validateAccessToken} = require("../../handlers/validateToken");
const {checkRequiredPermissions} = require("../../handlers/permissionCheck");

router
    .get('/', validateAccessToken, checkRequiredPermissions(["recalcRanks"]), async function(req, res) {
        let conn;

        try {
            conn = await pool.getConnection();
            let playersRaw = await conn.query("SELECT * from `players`");

            let players = playersRaw.sort((a, b) => b.pp - a.pp);
            let countryRanks = {};

            for(let i = 0; i < players.length; i++) {
                let player = players[i];
                let globalRank = i + 1;
                let countryRank = 0;

                if(countryRanks[player.country] === undefined) {
                    countryRank = 1;
                    countryRanks[player.country] = 1;
                } else {
                    countryRank = countryRanks[player.country] + 1;
                    countryRanks[player.country] = countryRank;
                }

                await conn.query("UPDATE `players` SET rank = '" + globalRank + "', country_rank = '" + countryRank + "' WHERE id = '" + player.id + "'");
            }

            res.send("Recalculation done!");
        } catch(err) {
            console.log(err);
        } finally {
            if(conn) {
                await conn.end();
            }
        }
    });

module.exports = router;