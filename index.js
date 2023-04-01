const express = require('express'); // Web Framework
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const CONFIG = require("./config.json");
const {errorHandler} = require("./handlers/errorHandler");

// Routes
const playerRoutes = require('./routes/player');
const leaderboardRoutes = require('./routes/leaderboard');
const tagsRoutes = require('./routes/tags');
const mapsRoutes = require('./routes/maps');
const permissionRoutes = require('./routes/permission');
const modsRoutes = require('./routes/mods');
const userRoutes = require('./routes/user');

BigInt.prototype.toJSON = function() { return this.toString() }

app.use(cors());
app.use(bodyParser.json({ extended: true }));
app.use(errorHandler);

const server = app.listen(CONFIG.serverPort, function () {
    const host = server.address().address;
    const port = server.address().port;

    console.log("app listening at http://%s:%s", host, port);
});

const corsHeader = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", CONFIG.corsAllowOrigin);
    next();
}

app.use(corsHeader);

// Routes
app.use(`${CONFIG.urlPrefix}/player`, playerRoutes);
app.use(`${CONFIG.urlPrefix}/leaderboard`, leaderboardRoutes);
app.use(`${CONFIG.urlPrefix}/tags`, tagsRoutes);
app.use(`${CONFIG.urlPrefix}/maps`, mapsRoutes);
app.use(`${CONFIG.urlPrefix}/permission`, permissionRoutes);
app.use(`${CONFIG.urlPrefix}/mods`, modsRoutes);
app.use(`${CONFIG.urlPrefix}/user`, userRoutes);