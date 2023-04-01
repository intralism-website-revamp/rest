const express = require('express');
const router = express.Router();
const pool = require("../../dbConnection");

router
    .get('/:country', async function(req, res){
        let conn;

        try {
            conn = await pool.getConnection();
            let players = await conn.query("select * from `players` where country='" + req.params.country + "'");

            players = players.sort((a, b) => a.country_rank - b.country_rank);

            res.send(players);
        } catch(err) {
            console.log(err);
        } finally {
            if(conn) {
                await conn.end();
            }
        }
    });

module.exports = router;