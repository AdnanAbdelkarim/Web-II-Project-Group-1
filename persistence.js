const mongodb = require('mongodb')

let client = undefined
let db = undefined
let users = undefined
let session = undefined
let feeding_locations = undefined

async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient('mongodb+srv://mrmickeymouse117:MickeyPass123@cluster0.0c17jyx.mongodb.net/');
        await client.connect();
        db = client.db('project_related_database');
        users = db.collection('UserAccounts');
        session = db.collection('sessions');
        feeding_locations = db.collection('feeding_sites');
    }
}


async function get_user_information(username) {
    await connectDatabase();
    if (users) {
        let userInfo = await users.findOne({ 'username': username });
        return userInfo; // returning userInfo regardless of account lock status
    }
}

async function get_user_session_data(key) {
    await connectDatabase();
    if(session){
        let session_data = await session.find({'SessionKey': key}).toArray();
        return session_data[0]
    }
    return undefined;
}

async function get_feeding_locations(){
    await connectDatabase();
    if(feeding_locations){
        let locations = await feeding_locations.find({}).toArray();
        return locations;
    }
    return undefined;
}

module.exports = {
    get_user_information,
    get_user_session_data,
    get_feeding_locations
}