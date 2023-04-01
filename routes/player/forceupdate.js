const express = require('express');
const {validateAccessToken} = require("../../handlers/validateToken");
const router = express.Router();
const playerFunctions = require("../../functions/playerFunctions");
const userFunctions = require('../../functions/userFunctions');
const helperFunctions = require('../../functions/helperFunctions');

router
    .get('/:email', validateAccessToken, async function(req, res) {
        let email = helperFunctions.validateEmail(req.params.email);

        if(email === null || email.length === 0) {
            res.send("Entered email is not valid");
            return;
        }

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