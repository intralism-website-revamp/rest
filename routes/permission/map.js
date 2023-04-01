const express = require('express');
const router = express.Router();
const {validateAccessToken} = require("../../handlers/validateToken");
const {checkRequiredPermissions} = require("../../handlers/permissionCheck");

router
    .get('/', validateAccessToken, checkRequiredPermissions(["addMaps", "removeMaps"]), async function(req, res) {
        res.send("User has access to delete/add maps");
    });

module.exports = router;