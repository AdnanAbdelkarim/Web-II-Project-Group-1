const express = require('express');
const bodyParser = require('body-parser');
const business = require('./business.js');

const app = express();
const port = 8000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('./public/login.html');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
