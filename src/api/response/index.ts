import { Response } from "express";

import logger from "../../lib/logger";
import { ResponseStatus } from "../enums";


export default {
    success: (res: Response, code: ResponseStatus, message: string, data?: any, meta?: any) => {
        const response = {
            status: "success",
            message,
            data,
            meta
        };

        logResponse(res, response, code, "response");
        return res.status(code).json(response);
    },

    error: (res: Response, code: ResponseStatus, message: string) => {
        const response = {
            status: "error",
            message,
        };

        logResponse(res, response, code, "error");
        return res.status(code).json(response);
    }
};


const logResponse = (res: Response, body: any, code: ResponseStatus, type: string) => {
    const req: any = res.req;

    const startTime = req._startTime || new Date();
    const rightNow: any = new Date();
    const ageSinceRequestStart = rightNow - startTime;

    const payload = {
        service: "mono-test-api",
        timestamp: new Date(),
        type: "response",
        classification: type,
        created: startTime,
        age: `${req.headers.age ? req.headers.age + ageSinceRequestStart : ageSinceRequestStart}ms`,
        endpoint: req.originalUrl || req.url,
        tag: req.tag || req.headers["tag"],
        code,
        payload: {
            verb: req.method,
            client: req.headers["x-forwarded-for"]
                ? req.headers["x-forwarded-for"].split(",")[0]
                : req.connection.remoteAddress,
            body,
        },
    };

    const logType = type === "error" ? "error" : "info";
    logger.log(logType, JSON.stringify(payload));
};