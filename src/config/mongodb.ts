import { env } from "../env";

const { mongo } = env.db;

const urlSchema = (mongo.host === "localhost" || mongo.host === "127.0.0.1") ? "mongodb://" : "mongodb+srv://";
export const mongoUri = `${urlSchema}${mongo.username ? mongo.username + ":" : ""}${mongo.password ? mongo.password + "@" : ""}${mongo.host}${mongo.port ? ":" + mongo.port : ""}/${mongo.database}`;