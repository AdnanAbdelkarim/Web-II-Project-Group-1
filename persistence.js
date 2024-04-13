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
        session = db.collection('sessions')
        feeding_locations = db.collection('feeding_sites');
    }
}


async function getUserDetails(username) {
    await connectDatabase()
    if (users){
        let userInfo = await users.findOne({'username': username})
        if (userInfo == null) return undefined;
        else return userInfo; // returning userInfo regardless of account lock status
    }
}

async function saveSession(uuid, expiry, data) {
    await connectDatabase()
    await session.insertOne({sessionKey: uuid, Expiry: expiry, Data: data})
}


async function getSessionData(key) {
    await connectDatabase()
    result = await session.find({sessionKey: key}).toArray()
    return result[0]
}

async function updateSession(key, data) {
    await connectDatabase()
    let db = client.db('project_related_database')
    let session = db.collection('sessions')
    await session.replaceOne({sessionKey: key}, data)
}

async function deleteSession(key) {
    await connectDatabase()
    await session.deleteOne({sessionKey: key})
}

async function get_feeding_locations(){
    await connectDatabase();
    if(feeding_locations){
        let locations = await feeding_locations.find({}).toArray();
        return locations;
    }
    return undefined;
}

async function addUser(username, email, password){
    await connectDatabase()
    await users.insertOne({username: username, password: password, email: email, accountType: "standard"});
}


module.exports = {
    getUserDetails, saveSession, getSessionData, deleteSession, addUser, get_feeding_locations, updateSession
}