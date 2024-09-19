import express from "express";
import mongoose from "mongoose";

// import { RunSchedules, scheduleList } from "./api/services/CronService";
import expressConfig from "./config/express";
import { mongoUri } from "./config/mongodb";
import { redisClient } from "./config/redis";
import logger from "./lib/logger";


const app: express.Application = express();
const PORT = process.env.PORT || 80;

expressConfig(app);


// Function to establish connections to MongoDB and Redis
async function startServer() {
    const startTime = Date.now(); // Capture the start time

    try {
        // Connect to MongoDB
        await mongoose.connect(mongoUri);
        logger.info("Connected to MongoDB");

        // Connect to Redis
        await redisClient.connect();
        logger.info("Connected to Redis");

        // Optionally, start CRON jobs here after successful connection
        // logger.info("Starting CRON...");
        // RunSchedules(scheduleList);

        // Start the Express server after both connections are successful
        app.listen(PORT, () => {
            const endTime = Date.now(); // Capture the end time
            const startupTime = endTime - startTime; // Calculate startup time in milliseconds
            
            logger.info(`Application started on ${PORT}`);
            logger.info(`Startup time: ${startupTime}ms`); // Log the startup time
        });
    } catch (err) {
        logger.error("Error during startup: ", err);
        process.exit(1); // Exit the process if a connection fails
    }
}

// Start the server
startServer();