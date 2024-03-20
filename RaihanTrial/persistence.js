const mongodb = require('mongodb')

let client = undefined
let db = undefined
let users = undefined
let session = undefined

async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient('mongodb+srv://mrmickeymouse117:MickeyPass123@cluster0.0c17jyx.mongodb.net/');
        await client.connect();
        db = client.db('project_related_database');
        users = db.collection('UserAccounts');
    }
}


async function getUserDetails(username) {
    await connectDatabase()
    if (users){
        let userInfo = await users.findOne({'username': username})
        if (userInfo == null) return undefined;
        else return userInfo;
    }
}

async function test(){
    let exp_1 = await getUserDetails('MickeyMouse');
    console.log(exp_1);
}


module.exports = {
    getUserDetails
}