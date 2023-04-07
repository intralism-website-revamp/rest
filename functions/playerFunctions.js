const axios = require("axios");
const cheerio = require("cheerio");
const pool = require("../dbConnection");
const helper = require('../functions/helperFunctions');
const CONFIG = require('../config.json');

exports.UpdatePlayerFromWebsite  = async function(id, checkForTime) {
    const player = {};
    const { data } = await axios.get('https://intralism.khb-soft.ru/?player=' + id);
    const content = cheerio.load(data);
    const playerInfoDiv = content('body > main > div.row > div.col-md-4.text-md-right').text().split('\n');
    const tempName = content('body > main > div.mt-5 > h1 > span').text();
    player.id = id;
    player.name = tempName.substring(0, tempName.lastIndexOf("#"));
    player.name = player.name.split("#");
    player.country = content('body > main > div.mt-5 > p > span').text();
    player.countryShort = content('body > main > div.mt-5 > p > img').attr().class.split(' ')[1].split('-')[1];

    if (player.countryShort === "") {
        player.countryShort = "none";
    }

    player.accuracy = playerInfoDiv[3].split(':')[1].replace(" ", "").replaceAll("%", "");
    player.misses = playerInfoDiv[4].split(':')[1].replace(" ", "");
    player.points = content('body > main > p > span').text();
    player.points = player.points.replace('Ranked Points: ', '').replace(" ", "");
    player.picture = content('body > main > div.mt-5 > img').attr().src;

    let conn;

    if(player.points === "0.00") {
        try {
            conn = await pool.getConnection();
            await conn.query("DELETE FROM `players` where id='" + id + "';");
            await conn.query("DELETE FROM `scores` where player_id='" + id + "';");
        } catch(err) {
            console.log(err);
        } finally {
            if(conn) {
                await conn.end();
            }
        }

        return player;
    }

    let mapname = "default";
    let i = 0;
    player.scores = [];

    let maps;

    try {
        conn = await pool.getConnection();
        maps = await conn.query("select * from `maps`");
    } catch (err) {
        console.log(err);
    } finally {
        if(conn) {
            await conn.end();
        }
    }

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

        if(!maps.find(x => parseInt(x.id) === parseInt(score.id))) {
            continue;
        }

        const map = maps.find(x => parseInt(x.id) === parseInt(score.id));

        score.date = content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td:nth-child(1)').text();
        score.score = content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td:nth-child(3)').text();
        score.score = parseInt(score.score.replaceAll(" ", ""));
        score.maxscore = parseInt(map.score);
        score.accuracy = content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td:nth-child(4)').text();
        score.accuracy = parseFloat(score.accuracy.replaceAll("%", ""));
        score.misses = parseInt(content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td:nth-child(5)').text());
        score.points = parseFloat(content('body > main > div.table-responsive > table > tbody > tr:nth-child(' + i + ') > td:nth-child(6)').text());
        score.maxpoints = parseFloat(map.points);
        score.mapname = mapname;
        score.pp = Math.round(score.score / score.maxscore * (Math.pow(0.9, score.misses)) * score.accuracy * score.maxpoints * 0.08 * 2 * 100) / 100;
        score.image = map.image;

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
            if(map.status === 'Broken') {
                score.points = score.points - 0.01;
            }
        }

        player.scores.push(score);
    }

    player.scores.sort((a, b) => b.pp - a.pp);
    player.weightedpp = 0.0;

    for(let j = 0; j < player.scores.length; j++) {
        player.scores[j].weightedpp = Math.round(player.scores[j].pp * Math.pow(CONFIG.weightConstant, j) * 100) / 100;
        player.weightedpp += player.scores[j].weightedpp;
    }

    player.weightedpp = Math.round(player.weightedpp * 100) / 100;

    let updatePlayerResult = await exports.updatePlayer(player);
    player.globalRank = updatePlayerResult.globalRank;
    player.countryRank = updatePlayerResult.countryRank;
    await exports.updatePlayerScores(player, updatePlayerResult.updateTime, checkForTime);

    return player;
};

exports.updatePlayer = async function(player) {
    let updateTime = new Date();
    updateTime.setFullYear(1970);

    let conn;
    let newRank = 0;
    let countryNewRank = 0;

    try {
        conn = await pool.getConnection();

        const playerSql = await conn.query("SELECT * FROM `players` WHERE id = '" + player.id + "'");

        if(playerSql[0] === undefined) {
            let oneRankHigher = await conn.query("SELECT id, MAX(rank) FROM `players` WHERE pp > '" + player.weightedpp + "'");
            let oneRankHigherCountry = await conn.query("SELECT id, MAX(country_rank) FROM `players` WHERE pp > '" + player.weightedpp + "' AND country = '" + player.countryShort + "'");

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

            let playersWithLowerRank = await conn.query("SELECT id, rank FROM `players` WHERE pp < '" + player.weightedpp + "'");

            for(let i = 0; i < playersWithLowerRank.length; i++) {
                await conn.query("UPDATE `players` SET rank = '" + (parseInt(playersWithLowerRank[i]['rank']) + 1) + "' WHERE id = '" + playersWithLowerRank[i]['id'] + "';");
            }

            let playersWithLowerCountryRank = await conn.query("SELECT id, country_rank FROM `players` WHERE pp < '" + player.weightedpp + "' AND country = '" + player.countryShort + "'");

            for(let i = 0; i < playersWithLowerCountryRank.length; i++) {
                await conn.query("UPDATE `players` SET country_rank = '" + (parseInt(playersWithLowerCountryRank[i]['country_rank']) + 1) + "' WHERE id = '" + playersWithLowerCountryRank[i]['id'] + "';");
            }
        } else {
            updateTime.setTime(Date.parse(playerSql[0]['last_update']));
            let oldPp = playerSql[0]['pp'];

            const overtakenPlayers = await conn.query("SELECT * FROM `players` WHERE pp < '" + player.weightedpp + "' AND pp > '" + oldPp + "';");

            let highestRank = -1;
            for (let i = 0; i < overtakenPlayers.length; i++) {
                let overtakenPlayerRank = parseInt(overtakenPlayers[i]['rank']);

                if (overtakenPlayerRank <= highestRank || highestRank === -1) {
                    highestRank = overtakenPlayerRank;
                }

                await conn.query("UPDATE `players` SET rank = '" + (overtakenPlayerRank + 1) + "' WHERE id = '" + overtakenPlayers[i]['id'] + "';");
            }

            if (highestRank === -1) {
                highestRank = playerSql[0]['rank'];
            }

            newRank = highestRank;

            const overtakenCountryPlayers = await conn.query("SELECT * FROM `players` WHERE pp < '" + player.weightedpp + "' AND pp > '" + oldPp + "' AND country='" + player.countryShort + "';");

            let highestCountryRank = -1;
            for (let i = 0; i < overtakenCountryPlayers.length; i++) {
                let overtakenPlayerCountryRank = parseInt(overtakenCountryPlayers[i]['country_rank']);

                if (overtakenPlayerCountryRank <= highestCountryRank || highestCountryRank === -1) {
                    highestCountryRank = overtakenPlayerCountryRank;
                }

                await conn.query("UPDATE `players` SET country_rank = '" + (overtakenPlayerCountryRank + 1) + "' WHERE id = '" + overtakenCountryPlayers[i]['id'] + "';");
            }

            if (highestCountryRank === -1) {
                highestCountryRank = playerSql[0]['country_rank'];
            }

            countryNewRank = highestCountryRank;
        }

        await conn.query("INSERT INTO `players`(`id`, `name`, `image`, `pp`, `points`, `rank`, `country`, `country_rank`, `accuracy`, `misses`, `last_update`) VALUES('" + player.id + "', '" + player.name + "', '" + player.picture + "', '" + player.weightedpp + "', '" + player.points + "', '" + newRank + "', '" + player.countryShort + "', '" + countryNewRank + "', '" + player.accuracy + "', '" + player.misses + "', '" + new Date() + "') ON DUPLICATE KEY UPDATE name = '" + player.name + "', image = '" + player.picture + "', pp = '" + player.weightedpp + "', points = '" + player.points + "', rank = '" + newRank + "', country = '" + player.countryShort + "', country_rank = '" + countryNewRank + "', accuracy = '" + player.accuracy + "', misses = '" + player.misses + "', last_update = '" + new Date() + "';");
    } catch (err) {
        console.log(err);
    } finally {
        if (conn) {
            await conn.end();
        }
    }

    return {updateTime: updateTime, globalRank: newRank, countryRank: countryNewRank};
};

exports.updatePlayerScores = async function(player, updateTime, checkForTime) {
    let conn;

    try {
        conn = await pool.getConnection();

        for(let i = 0; i < player.scores.length; i++) {
            const score = player.scores[i];

            if(helper.parseWebsiteDateToDate(score.date).getTime() < updateTime.getTime() && checkForTime) {
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
};