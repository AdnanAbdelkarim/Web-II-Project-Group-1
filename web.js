const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const business = require('./business.js');
const cookieParser = require('cookie-parser')
const handlebars = require('express-handlebars')
const app = express();
const port = 8000;





app.set('views', __dirname + "/templates")
app.set('view engine', 'handlebars')
app.engine('handlebars', handlebars.engine())
app.use(bodyParser.urlencoded())
app.use(cookieParser())


app.get('/', async (req, res) => {
    try {
        let data = await business.get_feeding_locations();
        res.render('public-viewers', { layout: undefined, locations: data });
    } catch (error) {
        // Handle error appropriately, e.g., log it or send an error response
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/register', (req, res) => {
    res.render('register', {layout: undefined})
})

app.post('/register', async (req, res) => {
    let username = req.body.usernameInput
    let email = req.body.emailInput
    let password = req.body.passwordInput
    let reapeatPassword = req.body.passwordrepeatInput
    
    user = await business.getUserDetails(username)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/g.test(password);
    if(password === reapeatPassword && !user && password.length >= 8 && hasSpecialChar){
        await business.addUser(username, email, password)
        res.render('login', {layout: undefined, errorMessage: "Account has been created"})
    }
    else if (user){
        res.render("register", { 
            layout: undefined, 
            errorMessage: "Usernsame Already Exists", 
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            username: username,
            email: email,
        })
    }    
    else if (password.length < 8 || !hasSpecialChar){
        res.render("register", { 
            layout: undefined, 
            errorMessage: "Password must have at least 8 characters & has special character", 
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            username: username,
            email: email,
        })
    }
    else{
        res.render("register", { 
            layout: undefined, 
            errorMessage: "Passwords do not match!", 
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            username: username,
            email: email,
        }) 
    }

})


app.get('/login', (req, res) => {
    res.render('login', {layout: undefined});
});

app.post('/login', async (req, res) => {
    let username = req.body.usernameInput
    let password = req.body.passwordInput
    console.log(username)
    console.log(password)
    let valid = await business.validateCredentials(username, password)
    if (valid) {
        let session_id = await business.startSession({userName: username, accountType: valid})
        let sessionData = await business.getSessionData(session_id)
        if(valid === 'admin'){
            res.cookie('session', session_id, {expires: sessionData.Expiry})
            res.redirect('/admin')
        }
        else if(valid === 'standard'){
            res.cookie('session', session_id, {expires: sessionData.Expiry})
            res.redirect('/standard')
        }
    }
    else if (!valid){
        res.render("login", { 
            layout: undefined, 
            errorMessage: "Username DOES NOT EXIST", 
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            username: username,
        })
    }
    else{
        res.render('404', {layout: undefined})
    }
})


app.get('/standard', (req, res) => {
    activeCookie = req.cookies.session
    if(!activeCookie){
        res.redirect('/?message=The+session+has+ended')
        return
    }
    res.render('fakeUsers', {layout : undefined})
})
    


app.use(express.static(path.join(__dirname, 'dist')));
app.get('/admin', (req, res) => {
    activeCookie = req.cookies.session
    if(!activeCookie){
        res.redirect('/?message=The+session+has+ended')
        return
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/resetpassword', async (req, res) => {
    res.render('resetpassword', {layout: undefined})
})

app.post('/resetpassword', async (req, res) => {
    const email = req.body.email;
    // console.log(email)
    const userEmail = await business.getUserbyEmail(email);
    // console.log(userEmail)

    if (!userEmail) {
        return res.render("resetpassword", { layout: undefined, errorMessage: "Email not Registered!" });
    }
    else {
        res.cookie('tempCookie', email); // Set the cookie
        // console.log(res.cookie.tempCookie)
        console.log("Cookie set successfully");
        res.redirect('/passwordreset'); // Redirect to a route where you can check the cookie
    }
});

app.get('/passwordreset', (req, res) => {
    res.render('passwordreset', {layout: undefined})
})

app.post('/passwordreset', async (req, res) => {
    const email = req.cookies.tempCookie
    // console.log(email)
    newPass = req.body.passwordInput
    newPassRepeated = req.body.passwordrepeatInput
    passwordvalidation = await business.passwordvalidity(newPass, newPassRepeated)
    if(!passwordvalidation){
        res.render("passwordreset",
        { layout: undefined, errorMessage: "The password must consist of a minimum of 8 characters, including at least one special character, and it must match the confirmation password." });
    }
    else{
        await business.updatePassword(email, newPass)
        console.log("PASSWORD CHANGED :)", newPass)

        res.redirect('/login')
    }
})


app.get('/logout', (req, res) => {
    activeCookie = req.cookies.session
    if(activeCookie){
        business.deleteSession(activeCookie)
    }
    res.clearCookie('session')
    res.redirect('/login')
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
