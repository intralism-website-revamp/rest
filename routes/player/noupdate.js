const express = require('express');
const router = express.Router();
const pool = require("../../dbConnection");

router
    .get('/:playerid', async function(req, res) {
        let playerId = req.params.playerid;

        try {
            BigInt(playerId);
        } catch(err) {
            console.log(err);
            res.send('Player ID is not a BigInt');

            return;
        }

        let conn;

        try {
            conn = await pool.getConnection();
            let playerRaw = await conn.query("select * from `players` where id='" + playerId + "'");

            if(playerRaw[0] === undefined) {
                res.send(JSON.stringify(null));
                return;
            }

            let player = playerRaw[0];
            let country;

            if(player.country === "none") {
                country = "Unknown Country";
            } else {
                let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
                country = regionNames.of(player.country.toUpperCase());
            }

            let scoresRaw = await conn.query("select * from `scores` where player_id='" + playerId + "'");
            let maps = await conn.query("select * from `maps`");
            let scores = [];

            for(let i = 0; i < scoresRaw.length; i++) {
                let scoreRaw = scoresRaw[i];
                let scoreInfo = maps.find(x => x.id === scoreRaw.map_id);

                let score = {
                    id: scoreRaw.map_id,
                    grade: scoreRaw.grade,
                    mapname: scoreInfo.name,
                    image: scoreInfo.image,
                    maxpoints: scoreInfo.points,
                    date: scoreRaw.date,
                    hardcore: scoreRaw.hardcore,
                    accuracy: scoreRaw.accuracy,
                    misses: scoreRaw.misses,
                    weightedpp: "",
                    pp: scoreRaw.pp
                }

                scores.push(score);
            }

            scores = scores.sort((a, b) => b.pp - a.pp);

            let playerInfo = {
                picture: player.image,
                name: player.name,
                globalRank: player.rank,
                country: country,
                countryShort: player.country,
                countryRank: player.country_rank,
                points: player.points,
                weightedpp: player.pp,
                scores: scores,
                accuracy: player.accuracy,
                misses: player.misses
            };

            res.send(JSON.stringify(playerInfo));
        } catch(err) {
            console.log(err);
        } finally {
            if(conn) {
                await conn.end();
            }
        }
    });

module.exports = router;