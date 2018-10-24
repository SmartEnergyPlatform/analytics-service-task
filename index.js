/*
 *    Copyright 2018 InfAI (CC SES)
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

const {
    Client,
    logger,
    Variables,
    File
} = require("camunda-external-task-client-js");
const querystring = require('querystring');
const request = require('request-promise');

const config = {
    baseUrl: process.env["CAMUNDA_URL"],
    use: logger
};

const client = new Client(config);

client.subscribe("export", async function ({task,taskService}) {
    // TODO check permission to access data export and if field is valid 
    
    var config = task.variables.get("config")
    if(config) {
        console.log("Recieved Configuration for historic data retrievel: " + config)
        var parsedConfig = JSON.parse(config)
        var action = parsedConfig["analysisAction"]
        var measurement = parsedConfig["measurement"]
        var databaseResult = null
        switch(action) {
            case "sum":
                databaseResult = await querySum(measurement,parsedConfig);
                break;
            case "count":
                databaseResult = await queryCount(measurement,parsedConfig);
                break;
            case "mean":
                databaseResult = await queryMean(measurement,parsedConfig);
                break;
            case "median":
                databaseResult = await queryMedian(measurement,parsedConfig);
                break;
            case "min":
                databaseResult = await queryMin(measurement,parsedConfig);
                break;
            case "max":
                databaseResult = await queryMax(measurement,parsedConfig);
                break;
            default:
                databaseResult = null
        }
        if(databaseResult) {
            console.log("Recieved data from database: " + databaseResult)
            var data = null
            try {
                data = JSON.parse(databaseResult)["results"][0]["series"][0]["values"][0][1]
            } catch (e) {
                await taskService.handleFailure(task, "database result does not have correct structure");
            }

            if(data) {
                const outputVariable = new Variables();
                console.log(task)
                outputVariable.set("global_export_result", data)
                await taskService.complete(task, outputVariable, null)
            }
        } else {
            await taskService.handleFailure(task, "database could not be requested");
        }
        
    }
});

async function querySum(measurement, config) {
    console.log("try to query sum")
    return queryDatabase("/measurement/" + measurement + "/sum", config)
}

async function queryMean(measurement, config) {
    console.log("try to query mean")
    return queryDatabase("/measurement/" + measurement + "/mean", config)
}

async function queryMedian(measurement, config) {
    console.log("try to query median")
    return queryDatabase("/measurement/" + measurement + "/median", config)
}

async function queryCount(measurement, config) {
    console.log("try to query count")
    return queryDatabase("/measurement/" + measurement + "/count", config)
}

async function queryDistinct(measurement, config) {
    console.log("try to query distinct")
    return queryDatabase("/measurement/" + measurement + "/distinct", config)
}

async function queryMin(measurement, config) {
    console.log("try to query min")
    return queryDatabase("/measurement/" + measurement + "/min", config)
}

async function queryMax(measurement, config) {
    console.log("try to query max")
    return queryDatabase("/measurement/" + measurement + "/max", config)
}

async function queryDatabase(path, config) {
    // TODO get userid from variable ??
    // TODO set query params from config object with same structure as infux api wrapper needs + interval optional + field
        var queryParams = {
            "field": config["measurementField"]
        }

        var interval = config["interval"]
        var dateInterval = config["dateInterval"]

        if(interval) {
            var time = null
            var type = interval["timeType"]
            var value = interval["value"]
            
            if (type == "minutes") {
                time = new Date(new Date().getTime() - (1000*60*value))
            } else if (type == "hours") {
                time = new Date(new Date().getTime() - (1000*60*60*value))
            } else if (type == "seconds") {
                time = new Date(new Date().getTime() - (1000*value))
            }

            if(time) {
                queryParams["time.gte"] = time.toISOString()
            }
        } 

        if(dateInterval) {
            var start = dateInterval["start"]
            var end = dateInterval["end"]

            if(start) {
                queryParams["time.gte"] = start
            }

            if(end) {
                queryParams["time.lte"] = end
            }
        } 
        console.log("Query Params: " + JSON.stringify(queryParams))
            
        return request({
            headers: {
                  'X-UserID': config["userid"]
            },
            uri: process.env["INFLUX_API_URL"] + path + "?" + querystring.stringify(queryParams),
            method: 'GET'
        })
}
