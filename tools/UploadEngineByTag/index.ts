import task = require('azure-pipelines-task-lib/task');
import axios from "axios";
import chalk from "chalk";

let argv = require('minimist')(process.argv.slice(2));

let URLS = {
    "DEV": [
        "https://dev-api.test.skl.io",
        "https://dev-api.au.test.skl.io"
    ],
    "PERF": [
        "https://api.perf.skl.io"
    ],
    "STAGING": [
        "https://staging-api.test.skl.io",
        "https://staging-api.au.test.skl.io"
    ],
    "PROD": [
        "https://api.skedulo.com",
        "https://api.au.skedulo.com",
        "https://api.uk.skedulo.com",
        "https://api.ca.skedulo.com",
    ]
}

async function run() {
    try {
        let adminToken = argv['adminToken']
        let appVersion = argv['appVersion']
        let engineVersion = argv['engineVersion']
        let env = argv['env'] ?? "DEV"

        if (!appVersion)
            throw Error("appVersion not provided")
        if (!adminToken)
            throw Error("adminToken not provided")
        if (!engineVersion)
            throw Error("engineVersion not provided")
        if (!env)
            throw Error("env not provided")

        console.log("adminToken", adminToken)
        console.log("appVersion", appVersion)
        console.log("engineVersion", engineVersion)
        console.log("env", env)

        let urls = URLS[env.toUpperCase()]

        console.log("urls", urls)

        const formData = new FormData();
        formData.append("appVersion", appVersion)
        formData.append("engineVersion", engineVersion)
        formData.append("tag", engineVersion)

        let failedUploadUrls = []

        for(let index in urls) {

            let url = urls[index]

             try {
                 logProcess("Uploading base engine for" + url)

                 let result = await axios.post(`${url}/form/engine/base`, formData, {
                     headers: {
                         "Authorization" : "Bearer " + adminToken
                     }
                 })

                 if (result.status != 200)
                     throw new Error(result.data)

             } catch (e) {
                 failedUploadUrls.push(url)

                 throw new Error("Failed to upload base engine for " + url)
             }


            logProcess("Done uploading base engine for " + url, true)
        }

        if (failedUploadUrls.length > 0) {
            console.log(chalk.red.bgWhite.bold('HOLD UP!!!'));

            console.log(chalk.red.bgWhite.bold("These environment has been failed to upload"), failedUploadUrls)
        }

    } catch (err) {
        task.setResult(task.TaskResult.Failed, err.message);
    }
}

function logProcess(message: string, end?: boolean) {
    console.log(`------ ${message} ------`)

    if (end)
        console.log("")
}


run();
