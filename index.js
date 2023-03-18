const express = require('express'); // Web Framework
const app = express();
const mariadb = require('mariadb');
const cors = require('cors');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const axios = require("axios");
const fs = require("fs");
const CONFIG = require("./config.json");

app.use(cors());
app.use(bodyParser.json({ extended: true }));

const scoresCsv = [];

BigInt.prototype.toJSON = function() { return this.toString() }

fs.readFile('./scores.csv', (err, data) => {
    if (err) throw err;
    let splittedData = data.toString().split('\n');

    for(let i = 0; i < splittedData.length; i++) {
        scoresCsv.push(splittedData[i]);
    }
})

const pool = mariadb.createPool({
    host: CONFIG.sqlIp,
    port: CONFIG.sqlPort,
    user: CONFIG.sqlUser,
    password: CONFIG.sqlPassword,
    database: CONFIG.sqlDatabase
});

const server = app.listen(CONFIG.serverPort, function () {
    const host = server.address().address;
    const port = server.address().port;

    console.log("app listening at http://%s:%s", host, port);
});

app.get(`${CONFIG.urlPrefix}/player/:id`, async function(req, res){
    const player = {};
    const { data } = await axios.get('https://intralism.khb-soft.ru/?player=' + req.params.id);
    const content = cheerio.load(data);
    const playerInfoDiv = content('body > main > div.row > div.col-md-4.text-md-right').text().split('\n');
    const tempName = content('body > main > div.mt-5 > h1 > span').text();
    player.id = req.params.id;
    player.name = tempName.substring(0, tempName.lastIndexOf("#"));
    player.name = player.name.split("#");
    player.country = content('body > main > div.mt-5 > p > span').text();
    player.countryShort = content('body > main > div.mt-5 > p > img').attr().class.split(' ')[1].split('-')[1];

    if (player.countryShort === "") {
        player.countryShort = "none";
    }

    //player.globalRank = content('body > main > div.row > div.col-md-4.text-md-right > span:nth-child(2)').text();
    //player.globalRankMax = playerInfoDiv[1].split('/')[1].replace(" ", "");
    //player.countryRank = content('body > main > div.row > div.col-md-4.text-md-right > span:nth-child(5)').text();
    //player.countryRankMax = playerInfoDiv[2].split('/')[1].replace(" ", "");
    player.accuracy = playerInfoDiv[3].split(':')[1].replace(" ", "").replaceAll("%", "");
    player.misses = playerInfoDiv[4].split(':')[1].replace(" ", "");
    player.points = content('body > main > p > span').text();
    player.points = player.points.replace('Ranked Points: ', '').replace(" ", "");
    player.picture = content('body > main > div.mt-5 > img').attr().src;

    let mapname = "default";
    let i = 0;
    player.scores = [];

    while(mapname !== "") {
        i++;
        mapname = content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td.text-left').text();

        if(mapname === "") {
            continue;
        }

        const score = {};
        score.hardcore = false;

        if(mapname.endsWith('Hardcore')) {
            mapname = mapname.substring(0, mapname.lastIndexOf('Hardcore'));
            score.hardcore = true;
        } else if(mapname.endsWith('Hidden') || mapname.endsWith('Endless') || mapname.endsWith('Random')) {
            continue;
        }

        const tempId = content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td.text-left > a').attr().href;
        score.id = tempId.substring(tempId.lastIndexOf('=') + 1, tempId.length);

        if(!scoresCsv.find(x => x.includes("," + score.id))) {
            continue;
        }

        const map = scoresCsv.find(x => x.includes(',' + score.id));

        score.date = content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td:nth-child(1)').text();
        score.score = content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td:nth-child(3)').text();
        score.score = parseInt(score.score.replaceAll(" ", ""));
        score.maxscore = parseInt(map.split(',')[4]);
        score.accuracy = content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td:nth-child(4)').text();
        score.accuracy = parseFloat(score.accuracy.replaceAll("%", ""));
        score.misses = parseInt(content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td:nth-child(5)').text());
        score.points = parseFloat(content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td:nth-child(6)').text());
        score.maxpoints = parseFloat(map.split(',')[1]);
        score.mapname = mapname;
        score.pp = Math.round(score.score / score.maxscore * (Math.pow(0.9, score.misses)) * score.accuracy * score.maxpoints * 0.08 * 2 * 100) / 100;
        //score.maxpp = Math.round(score.maxpoints * 0.08 * 2 * 100 * 100) / 100;
        score.image = content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td:nth-child(2)').children().get(0).children[0].attributes[0].value;

        let grade = 'Grade_';
        const acc = score.accuracy;

        if(acc === 100) {
            grade += 'SS.svg';
        } else if(acc < 100 && acc >= 99) {
            grade += 'S.svg';
        } else if(acc < 99 && acc >= 98) {
            grade += 'A.svg';
        } else if(acc < 98 && acc >= 96) {
            grade += 'B.svg';
        } else if(acc < 96 && acc >= 94) {
            grade += 'C.svg';
        } else if(acc < 94) {
            grade += 'F.svg';
        }

        score.grade = grade;

        if(score.accuracy === '100.00') {
            if(map.split(',')[3] === 'Broken') {
                score.points = score.points - 0.01;
            }
        }

        player.scores.push(score);
    }

    player.scores.sort((a, b) => b.pp - a.pp);
    player.weightedpp = 0.0;

    for(let j = 0; j < player.scores.length; j++) {
        player.scores[j].weightedpp = Math.round(player.scores[j].pp * Math.pow(0.95, j) * 100) / 100;
        player.weightedpp += player.scores[j].weightedpp;
    }

    player.weightedpp = Math.round(player.weightedpp * 100) / 100;

    let updatePlayerResult = await updatePlayer(player);
    player.globalRank = updatePlayerResult.globalRank;
    player.countryRank = updatePlayerResult.countryRank;
    await updatePlayerScores(player, updatePlayerResult.updateTime);

    res.header("Access-Control-Allow-Origin", "*");
    res.send(JSON.stringify(player));
});

async function updatePlayer(player) {
    let updateTime = new Date();
    updateTime.setFullYear(1970);

    let conn;
    let newRank = 0;
    let countryNewRank = 0;

    try {
        conn = await pool.getConnection();

        const playerSql = await pool.query("SELECT * FROM `players` WHERE id = '" + player.id + "'");

        if(playerSql[0] === undefined) {
            let oneRankHigher = await pool.query("SELECT id, MAX(rank) FROM `players` WHERE pp > '" + player.weightedpp + "'");
            let oneRankHigherCountry = await pool.query("SELECT id, MAX(country_rank) FROM `players` WHERE pp > '" + player.weightedpp + "' AND country = '" + player.countryShort + "'");

            if(oneRankHigher[0]['id'] === null) {
                newRank = "1";
            } else {
                newRank = (parseInt(oneRankHigher[0]['MAX(rank)']) + 1) + "";
            }

            if(oneRankHigherCountry[0]['id'] === null) {
                countryNewRank = "1";
            } else {
                countryNewRank = (parseInt(oneRankHigherCountry[0]['MAX(country_rank)']) + 1) + "";
            }

            let playersWithLowerRank = await pool.query("SELECT id, rank FROM `players` WHERE pp < '" + player.weightedpp + "'");

            for(let i = 0; i < playersWithLowerRank.length; i++) {
                await pool.query("UPDATE `players` SET rank = '" + (parseInt(playersWithLowerRank[i]['rank']) + 1) + "' WHERE id = '" + playersWithLowerRank[i]['id'] + "';");
            }

            let playersWithLowerCountryRank = await pool.query("SELECT id, country_rank FROM `players` WHERE pp < '" + player.weightedpp + "' AND country = '" + player.countryShort + "'");

            for(let i = 0; i < playersWithLowerCountryRank.length; i++) {
                await pool.query("UPDATE `players` SET country_rank = '" + (parseInt(playersWithLowerCountryRank[i]['country_rank']) + 1) + "' WHERE id = '" + playersWithLowerCountryRank[i]['id'] + "';");
            }
        } else {
            updateTime.setTime(Date.parse(playerSql[0]['last_update']));
            let oldPp = playerSql[0]['pp'];

            const overtakenPlayers = await pool.query("SELECT * FROM `players` WHERE pp < '" + player.weightedpp + "' AND pp > '" + oldPp + "';");

            let highestRank = -1;
            for (let i = 0; i < overtakenPlayers.length; i++) {
                let overtakenPlayerRank = parseInt(overtakenPlayers[i]['rank']);

                if (overtakenPlayerRank <= highestRank || highestRank === -1) {
                    highestRank = overtakenPlayerRank;
                }

                await pool.query("UPDATE `players` SET rank = '" + (overtakenPlayerRank + 1) + "' WHERE id = '" + overtakenPlayers[i]['id'] + "';");
            }

            if (highestRank === -1) {
                highestRank = playerSql[0]['rank'];
            }

            newRank = highestRank;

            const overtakenCountryPlayers = await pool.query("SELECT * FROM `players` WHERE pp < '" + player.weightedpp + "' AND pp > '" + oldPp + "' AND country='" + player.countryShort + "';");

            let highestCountryRank = -1;
            for (let i = 0; i < overtakenCountryPlayers.length; i++) {
                let overtakenPlayerCountryRank = parseInt(overtakenCountryPlayers[i]['country_rank']);

                if (overtakenPlayerCountryRank <= highestCountryRank || highestCountryRank === -1) {
                    highestCountryRank = overtakenPlayerCountryRank;
                }

                await pool.query("UPDATE `players` SET country_rank = '" + (overtakenPlayerCountryRank + 1) + "' WHERE id = '" + overtakenCountryPlayers[i]['id'] + "';");
            }

            if (highestCountryRank === -1) {
                highestCountryRank = playerSql[0]['country_rank'];
            }

            countryNewRank = highestCountryRank;
        }

        await pool.query("INSERT INTO `players`(`id`, `name`, `image`, `pp`, `points`, `rank`, `country`, `country_rank`, `accuracy`, `misses`, `last_update`) VALUES('" + player.id + "', '" + player.name + "', '" + player.picture + "', '" + player.weightedpp + "', '" + player.points + "', '" + newRank + "', '" + player.countryShort + "', '" + countryNewRank + "', '" + player.accuracy + "', '" + player.misses + "', '" + new Date() + "') ON DUPLICATE KEY UPDATE name = '" + player.name + "', image = '" + player.picture + "', pp = '" + player.weightedpp + "', points = '" + player.points + "', rank = '" + newRank + "', country = '" + player.countryShort + "', country_rank = '" + countryNewRank + "', accuracy = '" + player.accuracy + "', misses = '" + player.misses + "', last_update = '" + new Date() + "';");
    } catch (err) {
        console.log(err);
    } finally {
        if (conn) {
            await conn.end();
        }
    }

    return {updateTime: updateTime, globalRank: newRank, countryRank: countryNewRank};
}

async function updatePlayerScores(player, updateTime) {
    let conn;

    try {
        conn = await pool.getConnection();

        for(let i = 0; i < player.scores.length; i++) {
            const score = player.scores[i];

            if(parseWebsiteDateToDate(score.date).getTime() < updateTime.getTime()) {
                continue;
            }

            let stringQuery = "INSERT INTO `scores`(`map_id`, `player_id`, `date`, `score`, `accuracy`, `misses`, `points`, `pp`, `grade`, `hardcore`) VALUES ('" + score.id + "','" + player.id + "','" + score.date + "','" + score.score + "','" + score.accuracy + "','" + score.misses + "','" + score.points + "','" + score.pp + "','" + score.grade + "','" + (score.hardcore ? 1 : 0) + "') ON DUPLICATE KEY UPDATE date='" + score.date + "', score='" + score.score + "', accuracy='" + score.accuracy + "', misses='" + score.misses + "', points='" + score.points + "', pp='" + score.pp + "', grade='" + score.grade + "', hardcore='" + (score.hardcore ? 1 : 0) + "';";

            await conn.query(stringQuery);
        }
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            await conn.end();
        }
    }
}

function parseWebsiteDateToDate(websiteDate) {
    let date = new Date();

    if(websiteDate.includes("year")) {
        let years = 1;

        if(websiteDate.includes("years")) {
            years = parseInt(websiteDate.substring(0, websiteDate.indexOf("years ago")));
        }

        years *= 31540000000;

        date.setTime(date.getTime() - years);
    } else if(websiteDate.includes("month")) {
        let months = 1;

        if(websiteDate.includes("months")) {
            months = parseInt(websiteDate.substring(0, websiteDate.indexOf("months ago")));
        }

        months *= 2628000000;

        date.setTime(date.getTime() - months);
    } else if(websiteDate.includes("week")) {
        let weeks = 1;

        if(websiteDate.includes("weeks")) {
            weeks = parseInt(websiteDate.substring(0, websiteDate.indexOf("weeks ago")));
        }

        weeks *= 604800000;

        date.setTime(date.getTime() - weeks);
    } else if(websiteDate.includes("days") || websiteDate.includes("yesterday")) {
        let days = 1;

        if(websiteDate.includes("days")) {
            days = parseInt(websiteDate.substring(0, websiteDate.indexOf("days ago")));
        }

        days *= 86400000;

        date.setTime(date.getTime() - days);
    } else if(websiteDate.includes("hour")) {
        let hours = 1;

        if(websiteDate.includes("days")) {
            hours = parseInt(websiteDate.substring(0, websiteDate.indexOf("hours ago")));
        }

        hours *= 3600000;

        date.setTime(date.getTime() - hours);
    } else if(websiteDate.includes("minute")) {
        let minutes = 1;

        if(websiteDate.includes("minutes")) {
            minutes = parseInt(websiteDate.substring(0, websiteDate.indexOf("minutes ago")));
        }

        minutes *= 60000;

        date.setTime(date.getTime() - minutes);
    }

    return date;
}

app.get(`${CONFIG.urlPrefix}/leaderboard`, async function(req, res){
    let conn;

    try {
        conn = await pool.getConnection();
        let players = await conn.query('select * from `players`');

        players = players.sort((a, b) => a.rank - b.rank);

        res.header("Access-Control-Allow-Origin", "*");
        res.send(players);
    } catch(err) {
        console.log(err);
    } finally {
        if(conn) {
            await conn.end();
        }
    }
});

app.get(`${CONFIG.urlPrefix}/leaderboard/:country`, async function(req, res){
    let conn;

    try {
        conn = await pool.getConnection();
        let players = await conn.query("select * from `players` where country='" + req.params.country + "'");

        players = players.sort((a, b) => a.country_rank - b.country_rank);

        res.header("Access-Control-Allow-Origin", "*");
        res.send(players);
    } catch(err) {
        console.log(err);
    } finally {
        if(conn) {
            await conn.end();
        }
    }
});

app.get(`${CONFIG.urlPrefix}/tags/:playerid`, async function(req, res) {
   let conn;

   try {
       conn = await pool.getConnection();
       let tags = await conn.query("select t.name, t.order from `tags` as t, `player_tags` as pt where player_id='" + req.params.playerid + "' and t.id = pt.tag_id");

       tags = tags.sort((a, b) => b.id - a.id);

       res.header("Access-Control-Allow-Origin", "*");
       res.send(JSON.stringify(tags));
   } catch(err) {
       console.log(err);
   } finally {
       if(conn) {
           await conn.end();
       }
   }
});

app.get(`${CONFIG.urlPrefix}/playerNoUpdate/:playerid`, async function(req, res) {
   let conn;

   try {
       conn = await pool.getConnection();
       let playerRaw = await conn.query("select * from `players` where id='" + req.params.playerid + "'");

       if(playerRaw[0] === undefined) {
           res.header("Access-Control-Allow-Origin", "*");
           res.send(JSON.stringify(null));
           return;
       }

       let player = playerRaw[0];
       let country;

       if(player.country === "none") {
           country = "Unknown Country";
       } else {
           let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
           country = regionNames.of(player.country.toUpperCase());
       }

       let scoresRaw = await conn.query("select * from `scores` where player_id='" + req.params.playerid + "'");
       let scores = [];

       for(let i = 0; i < scoresRaw.length; i++) {
           let scoreRaw = scoresRaw[i];
           let scoreInfo = scoresCsv.find(x => x.includes(',' + scoreRaw.map_id));

           let score = {
               id: scoreRaw.map_id,
               grade: scoreRaw.grade,
               mapname: scoreInfo.split(',')[0],
               image: "",
               maxpoints: scoreInfo.split(',')[1],
               date: scoreRaw.date,
               hardcore: scoreRaw.hardcore,
               accuracy: scoreRaw.accuracy,
               misses: scoreRaw.misses,
               weightedpp: "",
               pp: scoreRaw.pp
           }

           scores.push(score);
       }

       scores = scores.sort((a, b) => b.pp - a.pp);

       let playerInfo = {
           picture: player.image,
           name: player.name,
           globalRank: player.rank,
           country: country,
           countryShort: player.country,
           countryRank: player.country_rank,
           points: player.points,
           weightedpp: player.pp,
           scores: scores
       };

       res.header("Access-Control-Allow-Origin", "*");
       res.send(JSON.stringify(playerInfo));
   } catch(err) {
       console.log(err);
   } finally {
       if(conn) {
           await conn.end();
       }
   }
});