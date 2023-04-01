const express = require('express');
const router = express.Router();
const updateRoutes = require('./player/update');
const noupdateRoutes = require('./player/noupdate');
const forceupdateRoutes = require('./player/forceupdate');

router
    .use('/update', updateRoutes)
    .use('/noupdate', noupdateRoutes)
    .use('/forceupdate', forceupdateRoutes);

module.exports = router;