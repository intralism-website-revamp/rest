const express = require('express');
const router = express.Router();
const allRoutes = require('./mods/all');

router
    .use('/all', allRoutes);

module.exports = router;