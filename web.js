const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const business = require('./business.js');
const cookieParser = require('cookie-parser')
const handlebars = require('express-handlebars')
const app = express();
const port = 8000;
const fileUpload = require('express-fileupload');

app.set('views', __dirname + "/templates")
app.set('view engine', 'handlebars')
app.engine('handlebars', handlebars.engine())
app.use(bodyParser.urlencoded())
app.use(cookieParser())


app.get('/', async (req, res) => {
    try {
        let data = await business.get_feeding_locations();
        res.render('public-viewers', {layout: undefined, locations: data });
    } catch (error) {
        res.render('404', { layout: undefined })
    }
});

app.get('/register', (req, res) => {
    res.render('register', { layout: undefined })
})

app.post('/register', async (req, res) => {
    let username = req.body.usernameInput;
    let email = req.body.emailInput;
    let password = req.body.passwordInput;
    let repeatPassword = req.body.passwordrepeatInput;

    user = await business.getUserDetails(username);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/g.test(password);
    if (password === repeatPassword && !user && password.length >= 8 && hasSpecialChar) {
        await business.addUser(username, email, password);
        res.render('login', { layout: undefined, errorMessage: "Account has been created" });
    } else if (user) {
        res.render("register", {
            layout: undefined,
            errorMessage: "Username Already Exists",
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            username: username,
            email: email,
        });
    } else if (password.length < 8 || !hasSpecialChar) {
        res.render("register", {
            layout: undefined,
            errorMessage: "Password must have at least 8 characters and contain a special character",
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            username: username,
            email: email,
        });
    } else if (password !== repeatPassword) {
        res.render("register", {
            layout: undefined,
            errorMessage: "Passwords do not match!",
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            username: username,
            email: email,
        });
    } else {
        res.render("register", {
            layout: undefined,
            errorMessage: "An error occurred",
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            username: username,
            email: email,
        });
    }
});



app.get('/login', (req, res) => {
    res.render('login', { layout: undefined });
});

app.post('/login', async (req, res) => {
    let username = req.body.usernameInput
    let password = req.body.passwordInput
    let valid = await business.validateCredentials(username, password)
    if (valid) {
        let session_id = await business.startSession({ userName: username, accountType: valid })
        let sessionData = await business.getSessionData(session_id)
        if (valid === 'admin') {
            res.cookie('session', session_id, { expires: sessionData.Expiry })
            res.redirect('/admin')
        }
        else if (valid === 'standard') {
            res.cookie('session', session_id, { expires: sessionData.Expiry })
            res.redirect('/standard')
        }
    }
    else if (!valid) {
        res.render("login", {
            layout: undefined,
            errorMessage: "Username DOES NOT EXIST",
            username: username,
        })
    }
    else {
        res.render('404', { layout: undefined })
    }
})


app.get('/standard', async (req, res) => {
    const activeCookie = req.cookies.session;
    if (!activeCookie) {
        return res.render('public-viewers', {
            layout: undefined,
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: data
        });
    }
    const data = await business.get_feeding_locations();
    if (!data) {
        return res.render('public-viewers', {
            layout: undefined,
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: []
        });
    }
    res.render('fakeUsers', {route:'Standard'});
});


app.get('/posts', async (req, res) => {
    let all_posts = await business.getPosts()

    activeCookie = req.cookies.session
    if (!activeCookie) {
        return res.render('public-viewers', {
            layout: undefined,
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: data
        });
    }
    res.render('posts', { route:'Posts', posts: all_posts })
});


app.use(fileUpload())
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.post('/posts', async (req, res) => {
    // get the data
    let textContent = req.body.textContent
    let postPic = req.files && req.files.post_pic

    // validate the data
    let errors = []

    // validate post text
    if (!textContent) {
        errors.push('Please enter a Text Content')
    }
    if (textContent.length > 100) {
        errors.push('Text Content cannot be more than 100 letters')
    }

    // validate picture/ file upload 
    if (postPic) {
        if (!['image/jpeg', 'image/png', 'image/jpeg'].includes(postPic.mimetype)) {
            errors.push('Only JPEG, PNG, and JPG files are allowed')
        }

        const maxSize = 1 * 1024 * 1024; // 1MB in bytes
        if (postPic.size > maxSize) {
            return res.status(400).send('File size exceeds the limit (1MB)');
        }
    } else {
        errors.push('Image is required')
        if (errors.length !== 0) {
            let all_posts = await business.getPosts()
            res.render('posts', { layout: undefined, errors, posts: all_posts })
            return
        }
    }



    if (errors.length !== 0) {
        let all_posts = await business.getPosts()
        res.render('posts', { layout: undefined, errors, posts: all_posts })
        return
    }

    let filePath = `/assets/${Date.now()}_${postPic.name}`
    await postPic.mv(`${__dirname}${filePath}`)
    // Save to db
    await business.createPost(textContent, filePath)
    let all_posts = await business.getPosts()
    res.render('posts', { layout: undefined, success: 'New Post Added Successfully', posts: all_posts })
})

app.get('/information', async (req, res) => {
    activeCookie = req.cookies.session
    
    if (!activeCookie) {
        res.redirect('/?message=The+session+has+ended')
        return
    }    
    
    try {
        let data = await business.get_feeding_locations();
        res.render('information', {locations: data, route: 'Information'});
    } catch (error) {
        res.render('404', { layout: undefined })
    }
});


app.use(express.static(path.join(__dirname, 'dist')));

app.get('/admin', async (req, res) => {
    const activeCookie = req.cookies.session;
    const data = await business.get_feeding_locations();
    if (!activeCookie) {
        return res.render('public-viewers', {
            layout: undefined,
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: data
        });
    }
    if (!data) {
        return res.render('public-viewers', {
            layout: undefined,
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: data
        });
    }
    const fixed_locations = await business.get_feeding_locations();
    res.render('admin1', {
        layout: undefined,
        locations: fixed_locations
    });
});




app.get('/feeding_stations', async(req, res) => {
    const fixed_locations = await business.get_feeding_locations();
    res.render('feeding_stations', {
        layout: undefined,
        locations: fixed_locations
    });

  
});

app.post('/delete_feeding_location', async (req, res) => {
    let siteNumber = req.body.siteNum;
    console.log(siteNumber)
    
    await business.delete_feeding_locations(siteNumber)

    res.redirect('/feeding_stations')
});

app.get('/add_feeding_station', async (req, res) => {
    res.render('add_feeding_station', {layout: undefined})

})

app.post('/add_feeding_station', async (req, res) => {
    num = req.body.sitenumber
    sitename = req.body.sitename
    sitelocation = req.body.sitelocation
    foodlevel = req.body.foodlevel
    water_level = req.body.water_level
    urgent_items = req.body.urgent_items
    cat_number = req.body.cat_number
    health_issues = req.body.health_issues
    sitestatus = req.body.status

    await business.add_feeding_locations(
        num, sitename, sitelocation, foodlevel, water_level, urgent_items, cat_number,
        health_issues, sitestatus)
        

        res.redirect('/feeding_stations')
})

app.get('/adminGraph', (req, res) => {
    res.render('adminGraph', {layout: undefined})
})



app.get('/resetpassword', async (req, res) => {
    res.render('resetpassword', { layout: undefined })
})

app.post('/resetpassword', async (req, res) => {
    const email = req.body.email;
    const userEmail = await business.getUserbyEmail(email);

    if (!userEmail) {
        return res.render("resetpassword", { layout: undefined, errorMessage: "Email not Registered!" });
    }
    else if (userEmail) {
        res.cookie('tempCookie', email); // Set the cookie
        console.log("An email has been sent to", email, "to reset your password")
        res.redirect('/passwordreset'); // Redirect to a route where you can check the cookie
    }
    else {
        res.render('404', { layout: undefined })
    }
});

app.get('/passwordreset', (req, res) => {
    res.render('passwordreset', { layout: undefined })
})

app.post('/passwordreset', async (req, res) => {
    const email = req.cookies.tempCookie
    newPass = req.body.passwordInput
    newPassRepeated = req.body.passwordrepeatInput
    passwordvalidation = await business.passwordvalidity(newPass, newPassRepeated)
    if (!passwordvalidation) {
        res.render("passwordreset",
            { layout: undefined, errorMessage: "The password must consist of a minimum of 8 characters, including at least one special character, and it must match the confirmation password." });
    }
    else {
        await business.updatePassword(email, newPass)
        console.log("The password has been changed")
        res.clearCookie('tempCookie')

        res.render('login',
            {
                layout: undefined,
                errorMessage: "The password has been reset successfully"
            })
    }
})

async function error404(req, res) {
    res.status(404).render("404", {
        layout: undefined
    })
}

app.get('/logout', async (req, res) => {
    let activeCookie = req.cookies.session;
    if (activeCookie) {
        await business.deleteSession(activeCookie);
    }
    res.clearCookie('session');
    res.redirect('/login');
});

async function error404(req, res) {
    res.status(404).render("404", {
        layout: undefined
    })
}

app.use(error404)

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
