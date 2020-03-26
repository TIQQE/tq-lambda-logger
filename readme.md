# A nodejs logger for AWS Lambda
* Writes logs to stdout/stderr using console.debug|info|warn|error
* Logs in JSON format
* Supports log levels: DEBUG, INFO, WARN, ERROR and OFF
* Defaults to log level INFO
* Built using typescript and includes types

## Basic example:
```typescript
import { APIGatewayEvent } from 'aws-lambda';
import { log } from 'tq-lambda-logger';

export const healthCheck = async (event: APIGatewayEvent) => {

// A standard INFO log message
log.info('My message');

}
```
```typescript
  // Output
  {
    "timestamp": "2020-03-26T14:36:07.345Z",
    "logLevel": "INFO",
    "message": "My message"
  }
```

## Log Levels 
The default log level is INFO `log.level = LogLevels.INFO;`. <br />
To show debug messages you need to explicitly set the log.level to DEBUG like this:

```typescript
// Set loglevel
log.level = LogLevels.DEBUG;
// Write debug log
log.debug('Debugging stuff');
```
```JSON
{
  "timestamp": "2020-03-26T14:36:07.345Z",
  "logLevel": "DEBUG",
  "message": "Message",
}
```
<br />

## Logging extra data
You can add any number of extra properties to the object when logging, like this:
```typescript
// Write info log
log.info({ message: 'Message', myProp: 'hello', myNestedProp: {subProp: 'something'} });
```
```JSON
{
  "timestamp": "2020-03-26T14:36:07.345Z",
  "logLevel": "INFO",
  "message": "Message",
  "myProp": "hello",
  "myNestedProp": {
    "subProp": "something"
  }
}
```

## Mute all logs:
```typescript
  log.level = LogLevels.OFF;
```

## Set log level with environment variable
You can easily set the initial log level by setting the environment variable `LOG_LEVEL`. This can be useful for setting different log levels in different environments TEST|PROD etc. Use 'OFF', 'DEBUG', 'INFO', 'WARN' or 'ERROR', like this:
```yml
LOG_LEVEL: 'DEBUG'
```

## Release process
Bump the `version` in `package.json` according to [semver](https://semver.org/spec/v2.0.0.html). If we are making a non-breaking change, compared to the last version, the new `version` would go from `0.11.0` to `0.12.0`.