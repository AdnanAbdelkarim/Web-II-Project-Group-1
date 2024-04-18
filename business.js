const persistence = require('./persistence')
const crypto = require('crypto')


async function getUserDetails(username) {
    return await persistence.getUserDetails(username)
}

async function getPosts() {
    return await persistence.getPosts()
}

async function getUserbyEmail(email) {
    return await persistence.getUserbyEmail(email)
}
async function updatePassword(email, password){
    return await persistence.updatePassword(email, salted_hashed_password(password))
}


async function validateCredentials(username, password){
    let data = await persistence.getUserDetails(username)
    let decompose_password = data.password.split(':');
    let salt = decompose_password[0];
    let secure_password = decompose_password[1];
    let hashed_non_salted_password_at_the_database = secure_password.replace(salt, '');
    if (!data || hashed_non_salted_password_at_the_database != crypto.createHash('sha256').update(password).digest('base64')) {
        return false
    }
    else {
        return data.accountType
    }
}

async function passwordvalidity(password, reapeatedPassword){
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if ((password.length < 8) || (!hasSpecialChar) || (password !== reapeatedPassword)) {
        return false
    }
    return true
}


async function startSession(data){
    sessionId = crypto.randomUUID()
    let sessionData = {
        sessionNumber: sessionId,
        data: data,
        expiry: new Date(Date.now() + 1000 * 60 * 5),
    }
    await persistence.saveSession(sessionData.sessionNumber, sessionData.expiry, sessionData.data)
    return sessionData.sessionNumber;
}

async function getSessionData(key) {
    return persistence.getSessionData(key);
}

async function deleteSession(key) {
    await persistence.deleteSession(key)
}

async function addUser(username, email, password){
    await persistence.addUser(username, email, salted_hashed_password(password))
}

async function createPost(textContent, filePath){
    await persistence.createPost(textContent, filePath)
}

async function get_feeding_locations(){
    return await persistence.get_feeding_locations();
}


function salted_hashed_password(password){
    let salt = crypto.randomBytes(16).toString('hex');
    console.log(salt)
    secure_password =  salt + crypto.createHash('sha256').update(password).digest('base64');
    console.log(secure_password)
    return `${salt}:${secure_password}`;
}
async function generateCSRFToken(sessionId) {
    let token = Math.floor(Math.random()*1000000)
    let sd = await persistence.getSessionData(Number(sessionId))
    sd.csrfToken = token
    await persistence.updateSession(Number(sessionId), sd)
    return token
}


async function cancelCSRFToken(sessionId) {
    let sd = await persistence.getSession(Number(sessionId))
    delete sd.csrfToken
    await persistence.updateSession(Number(sessionId), sd)
}

async function visitDetails(info){
    return await persistence.recordVisit(info)
}

async function reportDetails(info){
    return await persistence.recordReport(info)
}

async function update_feeding_locations(number, food_level, water_level, cat_number, urgent_items, health_issues, status){
    await persistence.update_feeding_locations(number, food_level, water_level, cat_number, urgent_items, health_issues, status)
}
async function delete_feeding_locations(number){
    return await persistence.delete_feeding_locations(number)
}

async function add_feeding_locations(number, name, location, food_level, water_level, urgent_items, cat_number, health_issues, status){
    return await persistence.add_feeding_locations(number, name, location, food_level, water_level, urgent_items, cat_number, health_issues, status)
}

module.exports = {
    validateCredentials, startSession,
    getSessionData, deleteSession, addUser,
    getUserDetails, get_feeding_locations,
    generateCSRFToken, cancelCSRFToken,
    getUserbyEmail, updatePassword, 
    salted_hashed_password, passwordvalidity, 
    visitDetails, reportDetails, createPost, getPosts,
    update_feeding_locations, delete_feeding_locations,
    add_feeding_locations
}