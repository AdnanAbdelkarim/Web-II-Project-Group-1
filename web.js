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

//Abdullatif Abuzannad - 60101855
app.get('/', async (req, res) => {
    try {
        let data = await business.get_feeding_locations();
        res.render('public-viewers', {layout: undefined, locations: data });
    } catch (error) {
        res.render('404', {layout: undefined})
    }
});

app.get('/register', (req, res) => {
    res.render('register', {layout: undefined})
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
        res.render('login', {layout: undefined, errorMessage: "Account has been created" });
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
            //let token = await business.generateCSRFToken(session_id)
            res.cookie('session', session_id, { expires: sessionData.Expiry })
            res.redirect('/admin')
        }
        else if (valid === 'standard') {
            res.cookie('session', session_id, { expires: sessionData.Expiry , httpOnly: true, secure: true})
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
            layout: 'main',
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: data
        });
    }
    const data = await business.get_feeding_locations();
    if (!data) {
        return res.render('public-viewers', {
            layout: 'main',
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: []
        });
    }
    res.render('fakeUsers', {layout:'main', route:'Standard'});
});

app.get('/blog', async (req, res) => {
    let all_blog = await business.getBlog()

    activeCookie = req.cookies.session
    if (!activeCookie) {
        return res.render('public-viewers', {
            layout: 'main',
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: data
        });
    }
    res.render('blog', { layout:'main', route:'Blog', blog: all_blog })
});


app.use(fileUpload())
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.post('/blog', async (req, res) => {
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

        const maxSize = 1 * 1024 * 1024; 
        if (postPic.size > maxSize) {
            return res.status(400).send('File size exceeds the limit (1MB)');
        }
    } else {
        errors.push('Image is required')
        if (errors.length !== 0) {

            let all_blog = await business.getBlog()
            res.render('blog', { layout: 'main', route: 'Blog', errors, blog: all_blog })

            return
        }
    }



    if (errors.length !== 0) {

        let all_blog = await business.getBlog()
        res.render('blog', { layout: 'main', route: 'Blog', errors, blog: all_blog })

        return
    }

    let filePath = `/assets/${Date.now()}_${postPic.name}`
    await postPic.mv(`${__dirname}${filePath}`)
    // Save to db
    await business.createPost(textContent, filePath)

    let all_blog = await business.getBlog()
    res.render('blog', { layout: 'main', route: 'Blog', success: 'New Post Added Successfully', blog: all_blog })
})

app.get('/catcarerecord', async (req, res) => {
    activeCookie = req.cookies.session
    
    if (!activeCookie) {
        res.redirect('/?message=The+session+has+ended')
        return
    }    
    
    try {
        let data = await business.get_feeding_locations();
        res.render('catcarerecord', {locations: data, route: 'Cat Care Record'})
    } catch (error) {
        res.render('404', { layout: undefined })
    }
});

app.post('/catcarerecord', async (req, res) => {
    litterBox = req.body.litterBox
    foodBowl = req.body.foodBowl
    waterBowl = req.body.waterBowl
    sitename = req.body.location
    urgent_items = {litterBox:litterBox, foodBowl:foodBowl, waterBowl:waterBowl}
    info = {
        sitename: sitename,
        foodlevel: req.body.foodlevel,
        water_level: req.body.waterLevel,
        cat_number: req.body.numberOfCats,
        health_issues: req.body.healthIssues,
        urgent_items: urgent_items,
        time: req.body.timeSubmitted
    }

    await business.visitDetails(info)
        

        res.redirect('/feeding_stations')
})

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/admin', async (req, res) => {
    const activeCookie = req.cookies.session;
    const data = await business.get_feeding_locations();
    if (!activeCookie) {
        return res.render('public-viewers', {
            layout: 'main',
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: data
        });
    }
    if (!data) {
        return res.render('public-viewers', {
            layout: 'main',
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: data
        });
    }
    const fixed_locations = await business.get_feeding_locations();
    res.render('feeding_stations', {
        layout: "adminMain",
        locations: fixed_locations
    });
});


app.get('/feeding_stations', async(req, res) => {
    const fixed_locations = await business.get_feeding_locations();
    res.render('feeding_stations', {
        layout: 'adminMain',
        locations: fixed_locations
    });
});

app.post('/delete_feeding_location', async (req, res) => {
    let siteNumber = req.body.siteNum;  
    await business.delete_feeding_locations(siteNumber)
    res.redirect('/feeding_stations')
});

app.get('/add_feeding_station', async (req, res) => {
    const activeCookie = req.cookies.session;
    if (!activeCookie) {
        return res.render('public-viewers', {
            layout: undefined,
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: data
        });
    }
    res.render('add_feeding_station', {layout: 'adminMain'})
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
        res.redirect('/admin')
})

app.get('/update_feeding_station', (req, res) => {
    const num = req.query.siteNum
    res.render('update_feeding_station', {layout: undefined, num:num})
})

app.post('/update_feeding_station', async(req, res) => {
    const num = req.body.siteNum
    const foodlevel = req.body.foodlevel
    const water_level = req.body.water_level
    const urgent_items = req.body.urgent_items
    const cat_number = req.body.cat_number
    const health_issues = req.body.health_issues
    const sitestatus = req.body.status
    await business.update_feeding_locations(num, foodlevel, water_level, cat_number, urgent_items, health_issues, sitestatus)
    res.redirect('/feeding_stations')
})

// Node.js route
app.get('/adminGraph', async(req, res) => {
    const activeCookie = req.cookies.session;
    if (!activeCookie) {
        return res.render('public-viewers', {
            layout: 'adminMain.handlebars',
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: data
        });
    }
    let food_water_amount = await business.get_feeding_locations(); // Array of objects
    let food = food_water_amount.map((item) => parseFloat(item.food_level));
    let water = food_water_amount.map((item) => parseFloat(item.water_level));

    // Calculate averages
    let foodAverage = food.reduce((acc, val) => acc + val, 0) / food.length;
    let waterAverage = water.reduce((acc, val) => acc + val, 0) / water.length;

    res.render('adminGraph', {
        layout: undefined,
        water: JSON.stringify(water), // Convert water array to JSON string
        food: JSON.stringify(food),  // Convert food array to JSON string
        foodAverage: foodAverage,
        waterAverage: waterAverage
    });
});


app.get('/admin_urgent', async(req, res) => {
    const activeCookie = req.cookies.session;
    if (!activeCookie) {
        return res.render('public-viewers', {
            layout: undefined,
            errorMessage: "The session has ended, please Login or Sign Up!",
            locations: data
        });
    }
    feedingLocations = await business.get_feeding_locations()
    let filteredLocations = [];
    for (i of feedingLocations){
        if(i.food_level <= 50 && i.water_level <= 50 && (i.status).toLowerCase() === "active"&& (i.health_issues).toLowerCase() !== 'none'){
            filteredLocations.push(i);
        }
    }
    res.render('admin_urgent', {
        layout: undefined,
        locations: filteredLocations})
})

app.get('/resetpassword', async (req, res) => {
    res.render('resetpassword', { layout: 'main' })
})

app.post('/resetpassword', async (req, res) => {
    const email = req.body.email;
    const userEmail = await business.getUserbyEmail(email);

    if (!userEmail) {
        return res.render("resetpassword", { layout: 'main', errorMessage: "Email not Registered!" });
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
    res.render('passwordreset', { layout: 'main' })
})

app.post('/passwordreset', async (req, res) => {
    const email = req.cookies.tempCookie
    newPass = req.body.passwordInput
    newPassRepeated = req.body.passwordrepeatInput
    passwordvalidation = await business.passwordvalidity(newPass, newPassRepeated)
    if (!passwordvalidation) {
        res.render("passwordreset",
            { layout: 'main', errorMessage: "The password must consist of a minimum of 8 characters, including at least one special character, and it must match the confirmation password." });
    }
    else {
        await business.updatePassword(email, newPass)
        console.log("The password has been changed")
        res.clearCookie('tempCookie')

        res.render('login',
            {
                layout: 'main',
                errorMessage: "The password has been reset successfully"
            })
    }
})

async function error404(req, res) {
    res.status(404).render("404", {
        layout: 'main'
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
        layout: 'main'
    })
}

app.use(error404)

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
})