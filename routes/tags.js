const express = require('express');
const router = express.Router();
const pool = require("../dbConnection");

router
    .get('/:playerid', async function(req, res){
        let conn;

        try {
            conn = await pool.getConnection();
            let tags = await conn.query("select t.name, t.order from `tags` as t, `player_tags` as pt where player_id='" + req.params.playerid + "' and t.id = pt.tag_id");

            tags = tags.sort((a, b) => b.id - a.id);

            res.send(JSON.stringify(tags));
        } catch(err) {
            console.log(err);
        } finally {
            if(conn) {
                await conn.end();
            }
        }
    });

module.exports = router;