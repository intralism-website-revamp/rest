const express = require('express');
const router = express.Router();
const pool = require("../../dbConnection");

router
    .get('/:country', async function(req, res){
        let country = req.params.country;

        let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});

        if(country.toLowerCase() !== "none") {
            console.log(country.toUpperCase());
            try {
                regionNames.of(country.toUpperCase());
            } catch(err) {
                console.log(err);
                res.send("Country doesn't exist");
                return;
            }
        }

        let conn;

        try {
            conn = await pool.getConnection();
            let players = await conn.query("select * from `players` where country='" + country + "'");

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