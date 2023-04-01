const express = require('express');
const router = express.Router();
const mapRoutes = require('./permission/map');
const adminRoutes = require('./permission/admin');

router
    .use('/map', mapRoutes)
    .use('/admin', adminRoutes);

module.exports = router;