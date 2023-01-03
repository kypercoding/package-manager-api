const { randomUUID } = require("crypto");


function createEnvironment(name, envType) {
    // randomized UUID
    var envID = randomUUID();

    // initialize a JSON object
    var environment = {
        "envID": envID,
        "name": name,
        "envType": envType,
        "packages": []
    };

    // return the environment
    return environment;
}

module.exports = {
    createEnvironment: createEnvironment
};
