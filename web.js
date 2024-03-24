const express = require('express');
const bodyParser = require('body-parser');
const business = require('./business.js');
const cookieParser = require('cookie-parser')
const handlebars = require('express-handlebars')
const multer = require('multer');
const app = express();
const port = 8000;


app.set('views', __dirname + "/template")
app.set('view engine', 'handlebars')
app.engine('handlebars', handlebars.engine())
app.use(bodyParser.urlencoded())
app.use(cookieParser())
const upload = multer({ dest: 'uploads/' });

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

app.get('/feeding', (req, res) => {
    console.log('GET request received for /feeding');
    console.log('Feeding Site:', req.body.feedingSite);
    console.log('Photo:', req.body.photo);
    console.log('Food & Water Amount Placed:', req.body.foodWaterAmount);
    console.log('Current Food Amount:', req.body.currentFoodAmount);
    console.log('Number of Cats:', req.body.numberOfCats);
    console.log('Health Issue:', req.body.healthIssue);
    res.send('GET request received for /feeding');
});


app.post('/feeding', upload.single('photo'), (req, res) => {
    console.log('POST request received for /feeding');
    console.log('Feeding Site:', req.body.feedingSite);
    console.log('Photo:', req.file); 
    console.log('Food & Water Amount Placed:', req.body.foodWaterAmount);
    console.log('Current Food Amount:', req.body.currentFoodAmount);
    console.log('Number of Cats:', req.body.numberOfCats);
    console.log('Health Issue:', req.body.healthIssue);
});


app.get('/login', (req, res) => {
    res.render('login', {layout: undefined});
});

app.get('/register', (req, res) => {
    res.render('register', {layout: undefined});
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
})

app.post('/register', async (req, res) => {
    let username = req.body.usernameInput
    let email = req.body.emailInput
    let password = req.body.passwordInput
    let reapeatPassword = req.body.passwordrepeatInput
    
    user = await business.getUserDetails(username)

    if(password === reapeatPassword && !user){
        await business.addUser(username, email, password)
        //res.redirect("/?message=The+account+has+been+created!")
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
    else{
        res.render("register", { 
            layout: undefined, 
            errorMessage: "Passwords do not match", 
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            username: username,
            email: email,
        })
    }

})

app.get('/standard', async (req, res) => {
    let locationDetails = await business.get_feeding_locations()
    res.render('fakeUsers', {
        layout : undefined,
        locationDetails
    })
});

app.get('/admin', (req, res) => {
    res.sendFile('./dist/index.html', {root:__dirname});
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
