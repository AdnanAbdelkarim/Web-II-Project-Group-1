const express = require('express');
const bodyParser = require('body-parser');
const business = require('./business.js');
const cookieParser = require('cookie-parser')
const handlebars = require('express-handlebars')

const app = express();
const port = 8000;

app.set('view engine', 'handlebars')
app.engine('handlebars', handlebars.engine())

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile('./public/login.html', {root: __dirname});
});

app.post('/', async (req, res) => {
    let username = req.body.username
    let password = req.body.password
    console.log(`${username} ${password}`)
    let valid = await business.validateCredentials(username, password)
    if (valid) {
        // let key = await business.startSession({username: username})
        // res.cookie('session', key)
        // return
        res.redirect('/users')
    }
})

app.get('/users', (req, res) => {
    res.sendFile('./public/fakeUsers.html', {root: __dirname});
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
