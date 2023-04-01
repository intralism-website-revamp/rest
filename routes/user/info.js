const express = require('express');
const router = express.Router();
const {validateAccessToken} = require("../../handlers/validateToken");
const userFunctions = require('../../functions/userFunctions');
const helperFunctions = require("../../functions/helperFunctions");

router
    .get('/:email', validateAccessToken, async function(req, res) {
        let email = helperFunctions.validateEmail(req.params.email);

        if(email === null || email.length === 0) {
            res.send("Entered email is not valid");
            return;
        }

        email = req.params.email;
        let returnValue = await userFunctions.GetUserInfoFromEmail(email);
        res.send(returnValue);
    });

module.exports = router;