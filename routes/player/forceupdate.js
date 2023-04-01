const express = require('express');
const {validateAccessToken} = require("../../handlers/validateToken");
const router = express.Router();
const playerFunctions = require("../../functions/playerFunctions");
const userFunctions = require('../../functions/userFunctions');

router
    .get('/:email', validateAccessToken, async function(req, res) {
        let userInfoRaw = await userFunctions.GetUserInfoFromEmail(req.params.email);
        let userInfo = JSON.parse(userInfoRaw);

        let steamId = userInfo.steam_id;

        if(steamId === undefined || steamId === null) {
            res.send("Steam Account not linked");
            return;
        }

        await playerFunctions.UpdatePlayerFromWebsite(steamId, false);
        res.send("Player updated");
    });

module.exports = router;