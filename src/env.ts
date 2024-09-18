import * as path from "path";

import * as dotenv from "dotenv";

import * as pkg from "../package.json";

import {
    getOsEnv,
    getOsEnvOptional,
    getOsEnvWithDefault,
    normalizePort,
    toNumber
} from "./lib/env";

/**
 * Load .env file or for tests the .env.test file.
 */
dotenv.config({
    path: path.join(
        process.cwd(),
        `.env${process.env.NODE_ENV === "test" ? ".test" : ""}`
    ),
});


/**
 * Environment variables
 */
export const env = {
    node: getOsEnvWithDefault("NODE_ENV", "dev"),
    isProduction: ["prod", "production"].includes(process.env.NODE_ENV),
    isDevelopment: ["dev", "development"].includes(process.env.NODE_ENV),
    isLocal: process.env.NODE_ENV === "local",
    isTest: process.env.NODE_ENV === "test",
    app: {
        name: (pkg as any).name,
        displayName: (pkg as any).displayName,
        version: (pkg as any).version,
        description: (pkg as any).description,
        host: getOsEnvOptional("APP_HOST"),
        port: normalizePort(process.env.PORT || undefined),
    },
    db: {
        mongo: {
            host: getOsEnvOptional("MONGODB_HOST"),
            password: getOsEnv("MONGODB_PASSWORD"),
            username: getOsEnv("MONGODB_USERNAME"),
            port: toNumber(getOsEnvOptional("MONGODB_PORT")),
            database: getOsEnvOptional("MONGODB_DATABASE"),
        },
    },
    caching: {
        redis: {
            host: getOsEnvWithDefault("REDIS_HOST", "127.0.0.1"),
            port: getOsEnvWithDefault("REDIS_PORT", "6379"),
            username: getOsEnvWithDefault("REDIS_USER", ""),
            password: getOsEnvWithDefault("REDIS_PASSWORD", ""),
        },
    },
    auth: {
        jwt: {
            hashtoken: getOsEnv("JWT_HASHER")
        }
    },
    config: {
        maxAccounts: toNumber(getOsEnvWithDefault("MAX_ACCOUNTS", "4")),
        defaultAmountForNewAccounts: toNumber(getOsEnvWithDefault("NEW_ACCOUNT_BALANCE", "5000"))
    }
};