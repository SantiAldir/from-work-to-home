import { connectToDB, disconnectFromDB, queryDB } from '../../DBFiles/connect.js';
import { RPGPDBconfig } from '../../shortcuts/constants.js';

const spellLevelsOds = {
    0: [1, 20],
    1: [21, 40],
    2: [41, 55],
    3: [56, 68],
    4: [69, 80],
    5: [81, 88],
    6: [89, 94],
    7: [95, 97],
    8: [98, 99],
    9: [100, 100]
};

const spellSchools = [
    'abjuration',
    'conjuration',
    'divination',
    'enchantment',
    'evocation',
    'illusion',
    'necromancy',
    'transmutation',
    'universal'
    ];

export async function randomSpell(){
    const spellQuery = `select distinct s.spellName
                        from "PF1".spells s
                        inner join "PF1".spellsByClasses b
                        on s.id = b.spellId
                        inner join "PF1".classes c
                        on c.id = b.classId
                        where c.className in ('wizard', 'sorcerer')
                        and b.spellLevel = $1
                        and s.school = $2`;
    const spellLevel = Math.floor(Math.random() * 100) + 1;
    let level = 0;
    for (const [key, value] of Object.entries(spellLevelsOds)) {
        if (spellLevel >= value[0] && spellLevel <= value[1]) {
            level = key;
            break;
        }
    } 

    const school = spellSchools[Math.floor(Math.random() * spellSchools.length)];
    const client = await connectToDB(RPGPDBconfig["user"], RPGPDBconfig["host"],
            RPGPDBconfig["database"], RPGPDBconfig["password"]
    );
    //console.log(`level: ${level}, school: ${school}`);
    var spellResult;
    try
    {
        spellResult = await client.query(spellQuery, [level, school]);
    }
    catch (err)
    {
        console.error('Query error:', err.stack);
    }   
    await disconnectFromDB(client);

    if (spellResult.rowCount === 0) {
        return null;
    }
    
    //console.log(spellResult);
    const randomIndex = Math.floor(Math.random() * spellResult.rowCount);
    const daysDuration = Math.floor(Math.random() * 4); 
    const hoursDuration = Math.floor(Math.random() * 12) + Math.floor(Math.random() * 12) + 2;
    const minutesDuration = Math.floor(Math.random() * 20) + 1;
    const totalDuration = `${daysDuration} days, ${hoursDuration} hours, ${minutesDuration} minutes`;
    return {spellName: spellResult.rows[randomIndex].spellname, spellLevel: level, spellSchool: school, duration: totalDuration };
};

// For testing
console.log(await randomSpell());