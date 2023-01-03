const { Client } = require("pg");
const { createEnvironment } = require("./env");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require("crypto");


/*
Create a new client object.
*/
function createClient() {
    // make a new client object
    return new Client({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT,
        password: process.env.PGPASSWORD
    });
}


/*
Create a new user and add the user
to the database.
*/
async function createUser(username, password) {
    // make a new user
    try {
        // length of salt
        const saltLength = 10;

        // create client object
        var client = createClient();

        // make the hashed password
        var hashed = await bcrypt.hash(password, saltLength);

        // connect the client
        await client.connect();

        // get results of query
        await client.query(
            "INSERT INTO users (user_id, username, password) VALUES ($1::UUID, $2::TEXT, $3::TEXT);",
            [randomUUID(), username, hashed]
        );

        // close client connection
        await client.end();

        return {"success": true};
    } catch (error) {
        console.log(error.stack);
        return {"success": false};
    }
}


/*
Login user to the API.
*/
async function loginUser(username, password) {
    // create client object
    var client = createClient();

    // make query
    var query = await {
        text: "SELECT password FROM users WHERE username = $1::TEXT;",
        values: [username]
    };

    // connect the client
    await client.connect();

    // get password hash
    var res = await client.query(query);
    var hashed = res.rows[0];

    var user = {"username": username};

    if (hashed == null) {
        return {"success": false};
    }

    // generate and return access tokens and refresh tokens
    if (await bcrypt.compare(password, hashed['password'])) {
        const accessToken = await jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"});
        const refreshToken = await jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "20m"});

        return {accessToken: accessToken, refreshToken: refreshToken};
    }
}


/*
Get UUID of username
*/
async function getUUID(username) {
    var client = createClient();

    // make query
    var query = {
        text: "SELECT user_id FROM users WHERE username = $1::TEXT;"
    };

    // connect the client
    await client.connect();

    // insert environment into database
    var res = await client.query(query, [username]);

    await client.end();

    return res.rows[0]["user_id"];
}


/*
Get all environments stored in the database.
*/
async function getAllEnvironments(username) {
    try {
        var client = createClient();

        // make query
        var query = {
            text: "SELECT json_data FROM environments, env_relations WHERE env_relations.user_id = $1::UUID AND env_relations.env_id = environments.env_id;"
        };

        var userID = await getUUID(username);

        // connect the client
        await client.connect();

        // insert environment into database
        var res = await client.query(query, [userID]);

        await client.end();

        return res.rows;
    } catch (error) {
        console.log(error.stack);
    }
}


/*
Create a new environment and add the environment
to the database,
*/
async function addEnvironment(username, name, envType) {
    try {
        var client = createClient();

        // connect the client
        await client.connect();

        // initialize a JSON object
        var environment = await createEnvironment(name, envType);

        // get UUID
        var userID = await getUUID(username);

        // insert
        var relationsQuery = await {
            text: "INSERT INTO env_relations (user_id, env_id) VALUES ($1::UUID, $2::UUID);",
            values: [userID, environment["envID"]]
        };

        // insert environment query
        var query = await {
            text: "INSERT INTO environments (env_id, json_data) VALUES ($1::UUID, $2::JSONB);",
            values: [environment["envID"], environment]
        };

        // insert environment into database
        await client.query(relationsQuery);
        await client.query(query);

        await client.end();
    } catch (error) {
        console.log(error.stack);
    }
}


/*
Get an environment based on an environment ID.
*/
async function getEnvironment(username, envID) {
    try {
        var client = createClient();

        // connect the client
        await client.connect();

        var userID = await getUUID(username);

        // make query
        var query = await {
            rowMode: "array",
            text: "SELECT environments.json_data FROM environments, env_relations WHERE environments.env_id = $1::UUID AND env_relations.user_id = $2::UUID AND environments.env_id = env_relations.env_id;",
            values: [envID, userID]
        };

        // insert environment into database
        var res = await client.query(query);

        await client.end();
        return res.rows[0];
    } catch (error) {
        console.log(error.stack);
    }
}


/*
Add packages to an environment given an
environment id and its list of packages.
*/
async function addPackages(username, envID, packages) {
    try {
        var client = createClient();

        var listPackages = packages.split(",");

        // connect the client
        await client.connect();

        // get environment JSON
        var environment = await getEnvironment(username, envID);

        environment = environment[0];

        // for every package in packages, add it to
        // json
        await listPackages.forEach(package => {
            package = package.trim();
            environment['packages'].push(package);
        });

        // update packages
        await client.query(
            "UPDATE environments SET json_data = $1::JSONB WHERE env_id = $2::UUID;",
            [environment, envID]
        );

        await client.end();

    } catch (error) {
        console.log(error.stack);
    }
}


/*
Delete all environments associated with a username.
*/
async function deleteEnvironments(username) {
    try {
        var client = createClient();

        // make query
        var query = {
            rowMode: "array",
            text: "DELETE FROM environments e USING env_relations r WHERE r.env_id = e.env_id AND r.user_id = $1::UUID;"
        };

        // make delete from relations query
        var relationsQuery = {
            rowMode: "array",
            text: "DELETE FROM env_relations WHERE user_id = $1::UUID;"
        };

        var userID = await getUUID(username);

        // connect the client
        await client.connect();

        // insert environment into database
        var res = await client.query(query, [userID]);
        var res = await client.query(relationsQuery, [userID]);

        await client.end();

        return res.rows;
    } catch (error) {
        console.log(error.stack);
    }
}


module.exports = {
    createUser, createUser,
    loginUser, loginUser,
    addEnvironment: addEnvironment,
    getEnvironment: getEnvironment,
    addPackages: addPackages,
    getAllEnvironments: getAllEnvironments,
    deleteEnvironments, deleteEnvironments
}
