const express = require('express');
const router = express.Router();
const pool = require('../../dbConnection');

router
    .get('/', async function(req, res){
        let conn;

        try {
            conn = await pool.getConnection();
            let maps = await conn.query("select * from `maps`");

            maps = maps.sort((a, b) => b.pp - a.pp);

            res.send(JSON.stringify(maps));
        } catch(err) {
            console.log(err);
        } finally {
            if(conn) {
                await conn.end();
            }
        }
    });

module.exports = router;