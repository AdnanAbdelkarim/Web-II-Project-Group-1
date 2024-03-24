const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const app = express();
const cookieParser = require('cookie-parser');
const business = require('./business.js');
const port = 3000;

app.set('views', __dirname + "/templates");
app.set('view engine', 'handlebars');
app.engine('handlebars', engine({ layoutsDir: __dirname + "/templates", defaultLayout: false })); // Disable layouts
// Serve static files from the 'public' directory
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
// main login page for admin and normal user 
app.use(cookieParser());



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

app.get('/', async (req, res) => {
    try {
        let data = await business.get_feeding_locations();
        res.render('public-viewers', { imagePath: '/av1.1.png', locations: data });
    } catch (error) {
        // Handle error appropriately, e.g., log it or send an error response
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
