const mariadb = require("mariadb");
const CONFIG = require("./config.json");

const pool = mariadb.createPool({
    host: CONFIG.sqlIp,
    port: CONFIG.sqlPort,
    user: CONFIG.sqlUser,
    password: CONFIG.sqlPassword,
    database: CONFIG.sqlDatabase
});

module.exports = pool;