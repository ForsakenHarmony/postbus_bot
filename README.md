# TRAPSBOT

A telegram bot for daily reminders

## Running it

1. Install node >= 7
2. `npm install`
3. Start `redis` locally
4. set the `BOT_TOKEN` enviroment variable to your token
5. `npm start` 

## Docker

1. `docker build -t yourname/trapsbot .`
2. `docker run -d -e BOT_TOKEN=yourtoken -e REDIS_HOST=redishost -e REDIS_PORT=redisport yourname/trapsbot`
