# Server Start
- export ENVIRONMENT=dev
- ENVIRONMENT=dev node server.js 
- ENVIRONMENT=prod node cronjob.js

# Client Start
- client/node webserver.js

APP Server
===========
## For Development
 - pm2 start process.json --env development

## For Production
- pm2 start process.json --env development
- pm2 start process_cronjob.json --env production
