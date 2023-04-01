const express = require('express');
const router = express.Router();
const {validateAccessToken} = require("../../handlers/validateToken");
const {checkRequiredPermissions} = require("../../handlers/permissionCheck");

router
    .get('/', validateAccessToken, checkRequiredPermissions(["addMaps", "removeMaps", "recalcRanks"]), async function(req, res) {
        res.send("User has admin permission");
    });

module.exports = router;