const persistence = require('./persistence')
const crypto = require('crypto')

async function getUserDetails(username) {
    return await persistence.getUserDetails(username)
}


async function validateCredentials(username, password){
    let data = await persistence.getUserDetails(username)
    if (!data || data.password != hashPassword(password)) {
        return false
    }
    else {
        return data.accountType
    }
}

async function startSession(data){
    sessionId = crypto.randomUUID()
    let sessionData = {
        sessionNumber: sessionId,
        data: data,
        expiry: new Date(Date.now() + 1000 * 60 * 1),
    }
    await persistence.saveSession(sessionData.sessionNumber, sessionData.expiry, sessionData.data)
    return sessionData.sessionNumber;
}

async function getSessionData(key) {
    return persistence.getSessionData(key);
}

async function deleteSession(key) {
    persistence.deleteSession(key)
}

async function addUser(username, email, password){
    await persistence.addUser(username, email, hashPassword(password))
}

async function get_feeding_locations(){
    return await persistence.get_feeding_locations();
}


function hashPassword(password){
    return crypto.createHash('sha256').update(password).digest('base64')
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

module.exports = {
    validateCredentials, startSession, getSessionData, deleteSession, addUser, getUserDetails, get_feeding_locations, hashPassword,generateCSRFToken, cancelCSRFToken
}