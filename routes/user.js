const express = require('express');
const router = express.Router();
const infoRoutes = require('./user/info');

router
    .use('/info', infoRoutes);

module.exports = router;