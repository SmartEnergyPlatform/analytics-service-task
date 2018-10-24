# What it does
This is an [external service task](https://docs.camunda.org/manual/7.6/user-guide/process-engine/external-tasks/) that gets an time interval as input parameter and performs an aggregation of data in this interval. 
This done by querying historic data from the InfluxDB from the interval, aggregating the values and then responsding it to the process.

# How it works
Cammunda can use service tasks that should be called to perform the process.
Therefore external service tasks are helpful because they are seperate from Cammunda and communicate with it via a [REST API](https://docs.camunda.org/manual/7.6/reference/rest/external-task/). This has some advantages like the possibility to implement with different technologies, to scale and to use microservice architecture.
For communicatiing with the API, cammunda provides the nodejs framework "camunda-external-task-client-js".

This service task needs the following process variables:
- userid: userid that needs to be appended to the request to the database
- measurementid: measurement id where the analysis e.g. aggregation should be performed
- field: measurement field where the analysis e.g. aggregation should be performed
- config: configuration on how the analysis should be performed, for example if the aggregation should be done on an time interval or a condition

## Process Variables
- all no device instance dependent parameters, like aggreagation method, gets selected in the process designer, and then set as input parameter "config" as a json string
- the device instance dependent parameters like measurements get set in the deploy step and get added to the "config" json parameter
- in the deploy step the prepare step adds the data exports for selection and the user selects an export and a measurement field which will be the values in the "config" parameter
- the output variable "export_result" is set by the process modeler with an null value, so that it gets presented in the modeler, then in this service task this variabel gets a value 

# Build and run
Environment variables:
- CAMUNDA_URL: hostname of cammunda
- INFLUX_API_URL: hostname of influx api wrapper

## JS
### Requirements
```
npm install
```

### Run
```
CAMUNDA_URL=http://fgseitsrancher.wifa.intern.uni-leipzig.de:8090/process/engine/engine-rest INFLUX_API_URL=http://fgseitsrancher.wifa.intern.uni-leipzig.de:8090/db npm start
```

## Docker
### Build
```
docker build -t service-worker .
```

### Run
```
docker run -e "CAMUNDA_HOST=fgseitsrancher.wifa.intern.uni-leipzig.de:8090/dose" -e "INFLUX_API_HOST=fgseitsrancher.wifa.intern.uni-leipzig.de:8090/db" service-worker
```

# Test

# TODO
- measurement field should be optional because service could be only plain text with out json strucutre
- and measurement field is only needed if the data exports has multiple values

# More 
https://blog.camunda.com/post/2015/11/external-tasks/
https://github.com/camunda/camunda-external-task-client-js
https://docs.camunda.org/manual/7.6/reference/rest/external-task/
https://docs.camunda.org/manual/7.6/user-guide/process-engine/external-tasks/
