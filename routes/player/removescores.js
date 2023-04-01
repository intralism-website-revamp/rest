const express = require('express');
const {validateAccessToken} = require("../../handlers/validateToken");
const router = express.Router();
const userFunctions = require('../../functions/userFunctions');
const pool = require('../../dbConnection');

router
    .get('/:email', validateAccessToken, async function(req, res) {
        let userInfoRaw = await userFunctions.GetUserInfoFromEmail(req.params.email);
        let userInfo = JSON.parse(userInfoRaw);

        let steamId = userInfo.steam_id;

        if(steamId === undefined || steamId === null) {
            res.send("Steam Account not linked");
            return;
        }

        let conn;

        try {
            conn = await pool.getConnection();
            await conn.query("DELETE FROM scores WHERE player_id = '" + steamId + "'");

            let updateTime = new Date();
            updateTime.setTime(0);

            await conn.query("UPDATE players SET last_update = '" + updateTime + "' WHERE id = '" + steamId + "'");
        } catch(err) {
            console.log(err);
        } finally {
            if(conn) {
                await conn.end();
            }
        }

        res.send("Scores deleted");
    });

module.exports = router;