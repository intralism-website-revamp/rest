const express = require('express');
const router = express.Router();
const pool = require('../../dbConnection');

router
    .get('/', async function(req, res) {
        let conn;

        try {
            conn = await pool.getConnection();
            let mods = await conn.query("SELECT * FROM `mods`");

            for(let i = 0; i < mods.length; i++) {
                let mod = mods[i];
                let dependencies = await conn.query("SELECT * FROM `mod_dependencies` where mod_id='" + mod.id + "'");
                let authorName = await conn.query("SELECT * FROM `players` WHERE id='" + mod.author + "'");

                if(authorName.length === 0) {
                    mod.authorName = "Unknown";
                } else {
                    mod.authorName = authorName[0].name;
                }

                if(dependencies.length === 0) {
                    continue;
                }

                mod.dependencies = [];

                for(let j = 0; j < dependencies.length; j++) {
                    let dependency = dependencies[j];
                    let dependencyModRaw = await conn.query("SELECT * FROM `mods` WHERE id='" + dependency.dependency_id + "'");
                    let dependencyMod = dependencyModRaw[0];

                    mod.dependencies.push({
                        name: dependencyMod.name,
                        version: dependencyMod.version,
                        downloadLink: dependencyMod.download_link
                    });
                }
            }

            res.send(JSON.stringify(mods));
        } catch(err) {
            console.log(err);
        } finally {
            if(conn) {
                await conn.end();
            }
        }
    });

module.exports = router;