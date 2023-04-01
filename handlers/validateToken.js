const { auth } = require("express-oauth2-jwt-bearer");
const CONFIG = require("../config.json");

const validateAccessToken = auth({
    issuerBaseURL: CONFIG.auth0Domain,
    audience: CONFIG.auth0Audience,
    tokenSigningAlg: 'RS256'
});

module.exports = {
    validateAccessToken,
};