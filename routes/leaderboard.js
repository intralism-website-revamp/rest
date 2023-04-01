const express = require('express');
const router = express.Router();
const globalRoutes = require('./leaderboard/global');
const countryRoutes = require('./leaderboard/country');
const recalcRoutes = require('./leaderboard/recalc');

router
    .use('/global', globalRoutes)
    .use('/country', countryRoutes)
    .use('/recalc', recalcRoutes);

module.exports = router;