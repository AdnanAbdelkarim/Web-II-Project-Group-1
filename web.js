const express=require('express')
const {engine} = require('express-handlebars')
let app = express()

app.set('views', __dirname+"/templates")
app.set('view engine', 'handlebars')
app.engine('handlebars', engine())

app.get('/', async (req, res) => {
    res.render('main', {layout: undefined})
});

app.get('/login', async(req, res) => {
    res.send("<h1>This is the login page</h1>")
})

app.get('/sign-up', async(req, res) => {
    res.send("<h1>This is the Sign-Up page</h1>")
})


app.listen(8000, () =>{
    console.log("App is running");
}) 