import compression from "compression";
import cors from "cors";
import { Application, json, Request, Response, urlencoded } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import router from "../api/routes";
import logger from "../lib/logger";
import loggerMiddleware from "../middleware/logger";


const corsOptions = {
    origin(origin, callback) {
        callback(null, true);
    },
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 50 // limit each IP to 50 requests per windowMs
});


const expressConfig = (app: Application): void => {
    app.use(cors(corsOptions));
    app.use(limiter);
    app.use(compression());
    app.use(
        urlencoded({
            extended: true,
        }),
    );
    app.use(json());
    app.use(loggerMiddleware);
    app.use(helmet());
    app.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"]
        }
    }));

    app.use((req: any, res, next) => {
        const startTime = req._startTime || new Date();
        const rightNow: any = new Date();
        const ageSinceRequestStart = rightNow - startTime;
    
        if (!req._startTime) req._startTime = startTime;
    
        const payload = {
            service: "mono-test-api",
            timestamp: new Date(),
            type: "request",
            created: startTime,
            age: `${req.headers.age ? req.headers.age + ageSinceRequestStart : ageSinceRequestStart}ms`,
            endpoint: req.originalUrl || req.url,
            tag: req.tag || req.headers["tag"],
            payload: {
                verb: req.method,
                client: req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress,
                headers: { ...req.headers, ...(req.headers.authorization ? { authorization: "Bearer xyz" } : {}) },
                body: req.body,
                param: req.param,
                query: req.query
            },
        };
    
        logger.log("info", JSON.stringify(payload));
        next();
    });

    app.get("/", (req: Request, res: Response) => res.send({ message: "Welcome" }));
    app.use("/api", router);
};

export default expressConfig;