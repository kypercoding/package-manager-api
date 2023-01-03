// import express, bcrypt-js, wintson, and dotenv packages
const express = require("express");
const dotenv = require("dotenv");
const xss = require('xss');
const jwt = require('jsonwebtoken');
dotenv.config();


// import helper database functions
const {
    addEnvironment,
    getEnvironment,
    addPackages,
    getAllEnvironments,
    createUser,
    loginUser,
    deleteEnvironments
} = require("./db");


// initialize express application
const app = express();

// import API server port
const PORT = 3000;

// parse JSON and URI-encoded data
app.use(express.json());
app.use(express.urlencoded({extended: true}));

/*
Verifies a JWT token, given a request, a response, and the
next function.
*/
function verifyToken(req, res, next) {
    // get header of the token
    var header = req.headers["authorization"];

    // get token from header
    var token = header.split(" ")[1];

    // if token is valid, then continue
    if (token != null) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                res.status(403).send("Token invalid");
            } else {
                // get username
                req.body.username = user.username;

                // have token in request
                req.token = token;

                next();
            }
        });
    } else {
        res.sendStatus(403);
    }
}

/*

API Routes for Handling Users:

| ---- POST ROUTES ---- |

== POST /create-user
    >> Create a new user.

== POST /login
    >> Login an existing user and provide a JWT token.
*/

app.post("/register", (req, res) => {
    // save user to database
    createUser(xss(req.body.username), xss(req.body.password));

    return res.status(201).send();
});


app.post("/login", async (req, res) => {
    // login user
    var tokens = await loginUser(xss(req.body.username), xss(req.body.password));

    if (tokens == null) {
        return res.status(401).send();
    }

    return res.json(tokens);
});


/*

API Routes for Handling Environments:

| ---- GET ROUTES ---- |

== GET /environments/:env-id
    >> Get a package environment based on env-id.

== GET /environments/:user-id/
    >> Get all package environments belonging to user-id.


| ---- POST ROUTES ---- |

== POST /create-environment
    >> Create a new package environment.

== POST /add-package/:env-id/
    >> Add a package to a user's environment.


| ---- DELETE ROUTES ---- |

== DELETE /delete-environment/:user-id/:env-id
    >> Delete a user's environment based on its user-id and env-id.

*/

app.get("/environments", verifyToken, async (req, res) => {
    var data = await getAllEnvironments(xss(req.body.username));
    res.status(200).send(data);
});


app.get("/environments/:envID", verifyToken, async (req, res) => {
    var environment = await getEnvironment(xss(req.body.username), xss(req.params.envID));

    res.status(200).send(environment);
});


app.post("/environments/add-environment", verifyToken, (req, res) => {
    // make an environment object and put into database
    addEnvironment(xss(req.body.username), xss(req.body.name), xss(req.body.envType));

    res.status(201).send();
});


app.put("/environments/add-packages", verifyToken, (req, res) => {
    // add packages to environment
    addPackages(xss(req.body.username), xss(req.body.envID), xss(req.body.packages));

    res.status(201).send();
});


app.delete("/environments/delete-environments", verifyToken, (req, res) => {
    // delete all environments related to user
    deleteEnvironments(xss(req.body.username));
    res.status(204).send();
});


// create server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
