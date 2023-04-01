const express = require('express');
const router = express.Router();
const playerFunctions = require("../../functions/playerFunctions");
const pool = require("../../dbConnection");

router
    .get('/:playerid', async function(req, res){
        let playerId = req.params.playerid;

        try {
            BigInt(playerId);
        } catch(err) {
            console.log(err);
            res.send('Player ID is not a BigInt');

            return;
        }

        let player = await playerFunctions.UpdatePlayerFromWebsite(playerId, true);

        player.missingScores = [];

        let maps, conn;

        try {
            conn = await pool.getConnection();
            maps = await conn.query("select * from `maps`");
        } catch (err) {
            console.log(err);
        } finally {
            if(conn) {
                await conn.end();
            }
        }

        for(let j = 0; j < maps.length; j++) {
            if(player.scores.find(x => BigInt(x.id) === BigInt(maps[j].id)) === undefined) {
                let map = maps[j];

                let missingScore = {
                    id: map.id,
                    name: map.name,
                    pp: map.pp,
                    points: map.points,
                    image: map.image
                };
                player.missingScores.push(missingScore);
            }
        }

        player.missingScores = player.missingScores.sort((a, b) => b.pp - a.pp);

        res.send(JSON.stringify(player));
    });

module.exports = router;