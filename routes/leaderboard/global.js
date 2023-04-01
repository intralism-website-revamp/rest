const express = require('express');
const router = express.Router();
const pool = require("../../dbConnection");

router
    .get('/', async function(req, res){
        let conn;

        try {
            conn = await pool.getConnection();
            let players = await conn.query('select * from `players`');

            players = players.sort((a, b) => a.rank - b.rank);

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