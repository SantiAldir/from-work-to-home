const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const https = require("https");
//const fetch = require("node-fetch"); // npm install node-fetch@2

const URL = "https://www.d20pfsrd.com/magic/spell-lists-and-domains/spell-lists-sorcerer-and-wizard/";

const agent = new https.Agent({
    keepAlive: true,
    maxSockets: 5,
    secureProtocol: "TLS_method"   // <--- important!
});

/*async function scrapeSpells() {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);

        const spells = [];

        // Adjust this selector based on actual table structure
        $("table tbody tr").each((i, el) => {
            const cols = $(el).find("td");

            if (cols.length >= 4) {
                const spellName = $(cols[0]).text().trim();
                const school = $(cols[1]).text().trim();
                const level = parseInt($(cols[2]).text().trim(), 10);
                const description = $(cols[3]).text().trim();

                spells.push({
                    name: spellName,
                    school: school,
                    level: level,
                    description: description
                });
            }
        });

        fs.writeFileSync("spells.json", JSON.stringify(spells, null, 2));
        console.log("✔ Spell list saved to spells.json");

    } catch (err) {
        console.log("Error scraping:", err);
    }
}*/

async function scrapeSpells() {
    const path = `./Spells`;
    const data = await fs.readFile(`${path}/spells.html`, 'utf8');
    const $ = cheerio.load(data);
    const spellList = {};
    var first;
    $("a.spell").each((i, spell) => {
        const name = $(spell).text().trim();
        const url = $(spell).attr("href");

        spellList[name] = url;
        if (i===1)
        {
            first = name;
        }
    });
    console.log(`${first}: ${spellList[first]}`);

    await fs.writeFile(`${path}/spellsUrls.json`, JSON.stringify(spellList, null, 2));
}

//scrapeSpells();

async function fetchHTML(url) {
    const res = await fetch(url, {
        agent,
        headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                    "AppleWebKit/537.36 (KHTML, like Gecko) " +
                    "Chrome/118.0.5993.90 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br"
        },
        timeout: 15000
    });
    return await res.text();
}

async function parseSpell(spellUrl) {
    /*const res = await fetch(spelluUrl);
    const html = await res.text();*/
    const html = fetchHTML(spellUrl)
    const $ = cheerio.load(html);

    // ---- GET SPELL NAME ----
    let spellName = $("h1").first().text().trim();
    if (!spellName) {
        // fallback to <title>
        spellName = $("title").text().replace("| d20PFSRD", "").trim();
    }

    // ---- GET THE <p> THAT CONTAINS SCHOOL / LEVEL ----
    const schoolPara = $("p")
        .filter((i, el) => $(el).text().includes("School"))
        .first();

    const paragraphText = schoolPara.text();

    // ---- EXTRACT SCHOOL ----
    // Pattern: School {schoolName}
    let school = "";
    const schoolMatch = paragraphText.match(/School\s+([a-zA-Z]+)/i);
    if (schoolMatch) {
        school = schoolMatch[1].toLowerCase();  // "evocation"
    }

    // ---- EXTRACT WIZARD/SORCERER LEVEL ----
    // Pattern: "sorcerer/wizard 3"
    let wizLevel = null;
    const levelMatch = paragraphText.match(/sorcerer\/wizard\s*([0-9]+)/i);
    if (levelMatch) {
        wizLevel = parseInt(levelMatch[1]);
    }

    // ---- BUILD RESULT OBJECT ----
    const result = {
        [spellName]: {
            spellUrl,
            school,
            level: wizLevel
        }
    };

    return result;
}

console.log(parseSpell("https://www.d20pfsrd.com/magic/all-spells/f/fireball/"));


async function test() {
    try {
        const res = await axios.get(
            "https://www.d20pfsrd.com/magic/all-spells/f/fireball/",
            {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                },
                timeout: 10000
            }
        );
        console.log("OK! HTML length:", res.data.length);
    } catch (err) {
        console.error("ERROR:", err.message);
    }
}

//test();