const express = require('express');
const router = express.Router();
const {validateAccessToken} = require("../../handlers/validateToken");
const userFunctions = require('../../functions/userFunctions');

router
    .get('/:email', validateAccessToken, async function(req, res) {
        const email = req.params.email;
        let returnValue = await userFunctions.GetUserInfoFromEmail(email);
        res.send(returnValue);
    });

module.exports = router;