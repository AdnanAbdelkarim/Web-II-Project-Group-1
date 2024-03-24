const persistence = require('./persistence');

async function get_feeding_locations(){
    return await persistence.get_feeding_locations();
}

module.exports = {
    get_feeding_locations
}

// async function test(){
//     let locations = await get_feeding_locations();
//     console.log(await locations);
// }

// test();