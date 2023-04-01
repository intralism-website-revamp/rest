const pool = require('../dbConnection');

exports.GetUserInfoFromEmail = async function(email) {
    let conn;
    let returnValue;

    try {
        conn = await pool.getConnection();
        let user = await conn.query("SELECT * FROM `users` where email='" + email + "'");
        returnValue = JSON.stringify(user[0]);
    } catch(err) {
        console.log(err);
    } finally {
        if(conn) {
            await conn.end();
        }
    }

    return returnValue;
};