const express = require('express');
const router = express.Router();
const allRoutes = require('./maps/all');
const byidRoutes = require('./maps/byid');
const scoresRoutes = require('./maps/scores');
const addRoutes = require('./maps/add');
const removeRoutes = require('./maps/remove');

router
    .use('/all', allRoutes)
    .use('/byid', byidRoutes)
    .use('/scores', scoresRoutes)
    .use('/add', addRoutes)
    .use('/remove', removeRoutes);

module.exports = router;