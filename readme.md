# Package Manager API

## Overview
The goal of this project is to create and test a REST-ful API that manages user environments for the Python and Ruby languages on a high level. The API makes use of NodeJS/ExpressJS with a PostgreSQL database.

## Usage

The base url of the API is as follows: [INSERT LINK HERE]

From there, the user can construct URL's with the following endpoints.

### /register (POST)

To register as a user for the API, make sure to include your desired username and password within the body of your request:

```json
{
    "username": username,
    "password": password
}
```

### /login (POST)

To login as a user for the API, make sure to include your username and password within the body of your request:

```json
{
    "username": username,
    "password": password
}
```

If the login is successful, you will receive two JWT tokens - an access token and a refresh token:

```json
{
    "accessToken": token,
    "refreshToken": token
}
```

### /environments/add-environment (POST)

To create a new environment for your Python or Ruby packages, pass in the access token in an "authorization" header. In addition, pass in the following data in the request body:

```json
{
    "name": name of your environment,
    "envType": type of environment - "python" or "ruby"
}
```

### /environments (GET)

To get all environments associated with your account, pass in the access token in an "authorization" header. It should return a list of json objects with the following format:

```json
[
    ...

    {
        "json_data": {
            "envID": id of environment,
            "name": name of environment,
            "envType": type of environment - "python" or "ruby",
            "packages": a list of packages in string format
        }
    }

    ...
]
```

### /environments/:envID (GET)

To get an environment associated with your account by environment id, call the total url, replacing ":envID" with the id of your choice (and passing in a JWT token in "authorization" as well):

{BASE_URL}/environment/{environment-id}

This should return only one JSON array with one JSON object containing the same type of JSON properties as in getting all environments.

### /environments/add-packages/:envID (PUT)

To add packages associated with your account by environment id, call the total url, replacing ":envID" with the id of your choice (and passing in your JWT access token in "authorization" as well):

{BASE_URL}/environment/{environment-id}

This should return only one JSON array with one JSON object containing the same type of JSON properties as in getting all environments.

### environments/delete-environments (DELETE)

To clear all environments associated with your account, call this endpoint with your JWT access token. This will clear all the environments you've created.

## Installation
If the user wishes to run the API locally, then the following technologies and tools must be installed on their computer:
* NodeJS
* PostgreSQL

The user can take the following steps:
1. Clone the repository somewhere on their computer.
2. Change to the directory of that repository.
3. Install the npm packages in package.json.
4. Create a .env file with the following contents:

```shell
PGUSER=[postgresql user]
PGDATABASE=[name of database]
PGPASSWORD=[password of database user]
PGPORT=[port of postgresql connection]
PGHOST=[host of postgresql connection]

ACCESS_TOKEN_SECRET=[a long JWT token secret]
REFRESH_TOKEN_SECRET=[another long JWT token secret]
```

5. Start the PostgreSQL server (i.e. starting service, etc)
6. Create a database corresponding to the value of your PGDATABASE variable.
7. Run the commands found in "setup.sql".
8. Run the API server by calling ```node server.js```

The API should now be functioning locally.
