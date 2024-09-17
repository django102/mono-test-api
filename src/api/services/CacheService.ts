import { redisClient } from "../../config/redis";

const EX = 86400; // 24 hours expiry time, in seconds


export default class CacheService {
    public static async set(key, value) {
        await redisClient.set(key, value, { EX });
    }

    public static async hSet(key, value) {
        await redisClient.hSet(key, value);
        await redisClient.expire(key, EX);
    }

    public static async jsonSet(key, value) {
        await redisClient.json.set(key, "$", value);
        await redisClient.expire(key, EX);
    }

    public static async get(key) {
        return await redisClient.get(key);
    }

    public static async hGet(key) {
        return await redisClient.hGetAll(key);
    }

    public static async jsonGet(key) {
        return await redisClient.json.get(key, { path: "$" });
    }

    public static async deleteKey(key) {
        await redisClient.del(key);
    }

    public static async deleteKeys(keys) {
        await redisClient.del(keys);
    }

    public static async deleteAll() {
        await redisClient.flushDb();
    }
}