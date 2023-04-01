const express = require('express');
const router = express.Router();
const pool = require('../../dbConnection');

router
    .get('/:mapid', async function(req, res) {
        let conn;

        try {
            conn = await pool.getConnection();
            let map = await conn.query("select * from `maps` where id='" + req.params.mapid + "'");

            res.send(JSON.stringify(map[0]));
        } catch(err) {
            console.log(err);
        } finally {
            if(conn) {
                await conn.end();
            }
        }
    });

module.exports = router;