const express = require('express');
const router = express.Router();
const updateRoutes = require('./player/update');
const noupdateRoutes = require('./player/noupdate');
const forceupdateRoutes = require('./player/forceupdate');
const removeScoresRoutes = require('./player/removescores');

router
    .use('/update', updateRoutes)
    .use('/noupdate', noupdateRoutes)
    .use('/forceupdate', forceupdateRoutes)
    .use('/removescores', removeScoresRoutes);

module.exports = router;