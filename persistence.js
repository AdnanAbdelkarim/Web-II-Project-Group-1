const mongodb = require('mongodb')

let client = undefined
let db = undefined
let users = undefined
let session = undefined
let feeding_locations = undefined
let visit_details = undefined
let incident_reports = undefined
let posts = undefined

async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient('mongodb+srv://mrmickeymouse117:MickeyPass123@cluster0.0c17jyx.mongodb.net/');
        await client.connect();
        db = client.db('project_related_database');
        users = db.collection('UserAccounts');
        posts = db.collection('posts');
        session = db.collection('sessions')
        feeding_locations = db.collection('feeding_sites');
        visit_details = db.collection('visit_details');
        incident_reports = db.collections('incident_reports');
    }
}


async function getUserDetails(username) {
    await connectDatabase()
    if (users) {
        let userInfo = await users.findOne({ 'username': username })
        if (userInfo == null) return undefined;
        else return userInfo; // returning userInfo regardless of account lock status
    }
}

async function getPosts() {
    await connectDatabase()
    if (posts) {
        let allposts = await posts.find({}).toArray()    
        return allposts; // returning userInfo regardless of account lock status
    }
}


async function getUserbyEmail(email) {
    await connectDatabase()
    if (users) {
        let emailInfo = await users.findOne({ 'email': email })
        if (emailInfo == null) return undefined;
        else return emailInfo;
    }

}

async function saveSession(uuid, expiry, data) {
    await connectDatabase()
    await session.insertOne({ sessionKey: uuid, Expiry: expiry, Data: data })
}


async function getSessionData(key) {
    await connectDatabase()
    result = await session.find({ sessionKey: key }).toArray()
    return result[0]
}

async function updateSession(key, data) {
    await connectDatabase()
    let db = client.db('project_related_database')
    let session = db.collection('sessions')
    await session.replaceOne({ sessionKey: key }, data)
}

async function updatePassword(email, password) {
    await connectDatabase()
    let db = client.db('project_related_database')
    let user = db.collection('UserAccounts')
    await user.updateOne({ 'email': email }, { $set: { 'password': password } })
}



async function deleteSession(key) {
    await connectDatabase()
    await session.deleteOne({ sessionKey: key })
}

async function get_feeding_locations() {
    await connectDatabase();
    if (feeding_locations) {
        let locations = await feeding_locations.find({}).toArray();
        return locations;
    }
    return undefined;
}
//For Member
async function update_feeding_locations(number, food_level, water_level, cat_number, health_issues, status){
    await connectDatabase()
    let feeding_locations = db.collection('feeding_sites');
    await feeding_locations.updateOne({"number": number},
    {$set:{
        "food_level": food_level,
        "water_level": water_level,
        "cat_number": cat_number,
        "health_issues": health_issues,
        "status": status
    }})
}

async function delete_feeding_locations(number){
    await connectDatabase()
    let feeding_locations = db.collection('feeding_sites');
    await feeding_locations.deleteOne({"number": number})
    return true
}

async function add_feeding_locations(number, name, location, food_level, water_level, urgent_items, cat_number, health_issues, status){
    await connectDatabase()
    let feeding_locations = db.collection('feeding_sites');
    await feeding_locations.insertOne({
        "number": number,
        "name": name,
        "location": location,
        "food_level": food_level,
        "water_level": water_level,
        "urgent_items": urgent_items,
        "cat_number": cat_number,
        "health_issues": health_issues,
        "status": status})
        return true
}


async function addUser(username, email, password) {
    await connectDatabase()
    await users.insertOne({ username: username, password: password, email: email, accountType: "standard" });
}

async function createPost(textContent, filePath) {
    await connectDatabase()
    await posts.insertOne({ textContent, filePath });
}

async function recordVisit(info) {
    await connectDatabase()
    let status = await visit_details.insertOne({
        visitDate: info.visitDate,
        foodWaterPlaced: info.foodWaterPlaced,
        currentFoodLevel: info.currentFoodLevel,
        numberOfCats: info.numberOfCats
    });
    return status;
}

async function recordReport(info) {
    await connectDatabase()
    let status = await incident_reports.insertOne({
        reportDate: info.reportDate,
        issueType: info.issueType,
        description: info.description,
        location: info.location
    });
    return status;
}

async function recordVisit(info){
    await connectDatabase()
    let status = await visit_details.insertOne({
        visitDate: info.visitDate,
        foodWaterPlaced: info.foodWaterPlaced,
        currentFoodLevel: info.currentFoodLevel,
        numberOfCats: info.numberOfCats
    });
    return status;
}

async function recordReport(info){
    await connectDatabase()
    let status = await incident_reports.insertOne({
        reportDate: info.reportDate,
        issueType: info.issueType,
        description: info.description,
        location: info.location
    });
    return status;
}

module.exports = {
    getUserDetails, saveSession,
    getSessionData, deleteSession,
    addUser, get_feeding_locations,
    updateSession, getUserbyEmail,
    updatePassword, recordVisit,
    recordReport, createPost, getPosts, delete_feeding_locations,
    add_feeding_locations, update_feeding_locations
}