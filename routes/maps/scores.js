const express = require('express');
const router = express.Router();
const pool = require('../../dbConnection');

router
    .get('/:mapid', async function(req, res) {
        let mapId = req.params.mapid;

        try {
            BigInt(mapId);
        } catch(err) {
            console.log(err);
            res.send('Map ID is not a BigInt');

            return;
        }

        let conn;

        try {
            conn = await pool.getConnection();
            let scores = await conn.query("select * from `scores` where map_id='" + mapId + "'");
            scores = scores.sort((a, b) => (b.score < a.score) ? -1 : ((b.score > a.score) ? 1 : 0));

            res.send(JSON.stringify(scores));
        } catch(err) {
            console.log(err);
        } finally {
            if(conn) {
                await conn.end();
            }
        }
    });

module.exports = router;