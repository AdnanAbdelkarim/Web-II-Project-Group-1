const persistence = require('./persistence')

async function validateCredentials(username, password){
    let data = await persistence.getUserDetails(username)
    if (!data || data.password != password) {
        return false
    }
    else {
        return true
    }
}

module.exports = {
    validateCredentials
}