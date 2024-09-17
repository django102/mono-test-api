import express from "express";
import mongoose from "mongoose";

import { RunSchedules, scheduleList } from "./api/services/CronService";
import expressConfig from "./config/express";
import { mongoUri } from "./config/mongodb";
import { redisClient } from "./config/redis";
import logger from "./lib/logger";


const app: express.Application = express();
const PORT = process.env.PORT || 80;

expressConfig(app);


mongoose.connect(mongoUri)
    .then(() => {
        logger.info("Connected to MongoDB");
    })
    .catch((err) => console.error("Could not connect to MongoDB...", err));

    
redisClient.connect()
    .then(() => {
        logger.info("Connected to Redis");
    })
    .catch((err) => console.error("Could not connect to Redis...", err));


logger.info("Starting CRON...");
RunSchedules(scheduleList); // run cron jobs


app.listen(PORT, () => {
    logger.info(`Application started on ${PORT}`);
});