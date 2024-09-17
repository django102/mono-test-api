import CacheService from "../../../src/api/services/CacheService"; // Adjust the path as needed
import { redisClient } from "../../../src/config/redis";

jest.mock("../../../src/config/redis", () => ({
    redisClient: {
        set: jest.fn(),
        hSet: jest.fn(),
        json: {
            set: jest.fn(),
            get: jest.fn()
        },
        get: jest.fn(),
        hGetAll: jest.fn(),
        expire: jest.fn(),
        del: jest.fn(),
        flushDb: jest.fn()
    }
}));


describe("CacheService", () => {
    const EX = 86400;
    const key = "testKey";
    const value = "testValue";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("set", () => {
        test("should set a key with expiry", async () => {
            await CacheService.set(key, value);
            expect(redisClient.set).toHaveBeenCalledWith(key, value, { EX });
        });
    });

    describe("hSet", () => {
        test("should set a hash key and set expiry", async () => {
            await CacheService.hSet(key, value);
            expect(redisClient.hSet).toHaveBeenCalledWith(key, value);
            expect(redisClient.expire).toHaveBeenCalledWith(key, EX);
        });
    });

    describe("jsonSet", () => {
        test("should set a JSON key and set expiry", async () => {
            await CacheService.jsonSet(key, value);
            expect(redisClient.json.set).toHaveBeenCalledWith(key, "$", value);
            expect(redisClient.expire).toHaveBeenCalledWith(key, EX);
        });
    });

    describe("get", () => {
        test("should get a key", async () => {
            (redisClient.get as jest.Mock).mockResolvedValue(value);
            const result = await CacheService.get(key);
            expect(redisClient.get).toHaveBeenCalledWith(key);
            expect(result).toBe(value);
        });
    });

    describe("hGet", () => {
        test("should get a hash key", async () => {
            const hashValue = { field1: "value1", field2: "value2" };
            (redisClient.hGetAll as jest.Mock).mockResolvedValue(hashValue);
            const result = await CacheService.hGet(key);
            expect(redisClient.hGetAll).toHaveBeenCalledWith(key);
            expect(result).toBe(hashValue);
        });
    });

    describe("jsonGet", () => {
        test("should get a JSON key", async () => {
            const jsonValue = { data: "value" };
            (redisClient.json.get as jest.Mock).mockResolvedValue(jsonValue);
            const result = await CacheService.jsonGet(key);
            expect(redisClient.json.get).toHaveBeenCalledWith(key, { path: "$" });
            expect(result).toBe(jsonValue);
        });
    });

    describe("deleteKey", () => {
        test("should delete a key", async () => {
            await CacheService.deleteKey(key);
            expect(redisClient.del).toHaveBeenCalledWith(key);
        });
    });

    describe("deleteKeys", () => {
        test("should delete multiple keys", async () => {
            const keys = ["key1", "key2"];
            await CacheService.deleteKeys(keys);
            expect(redisClient.del).toHaveBeenCalledWith(keys);
        });
    });

    describe("deleteAll", () => {
        test("should flush the database", async () => {
            await CacheService.deleteAll();
            expect(redisClient.flushDb).toHaveBeenCalled();
        });
    });
});