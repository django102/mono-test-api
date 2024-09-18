import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import moment from "moment";

import { env } from "../../env";
import logger from "../../lib/logger";
import { ResponseStatus } from "../enums";
import { ServiceResponse } from "../models/ServiceResponse";


const { hashtoken } = env.auth.jwt;


export default class AuthService {
    public static issueToken(data, expiresIn = "1h") {
        if (!data) return null;
        return jwt.sign(data, hashtoken, { expiresIn });
    }

    public static verifyToken(token) {
        if (!token) return null;
        return jwt.verify(token, hashtoken);
    }

    public static validateAuthentication(req: Request, res: Response, next: NextFunction): ServiceResponse | void {
        try {
            const { authorization } = req.headers;
            if (!authorization) {
                return ServiceResponse.error(res, null, "No Authorization", ResponseStatus.UNAUTHORIZED);
            }

            if (!authorization.startsWith("Bearer")) {
                return ServiceResponse.error(res, null, "Authorization format is \"Bearer xxxxxx\"", ResponseStatus.UNAUTHORIZED);
            }

            const auth = authorization.split(" ")[1];
            if (!auth) {
                return ServiceResponse.error(res, null, "Invalid Authorization", ResponseStatus.UNAUTHORIZED);
            }

            const decodedJwt = AuthService.verifyToken(auth);

            // check expiry
            const expiry = moment.unix(decodedJwt.exp);
            const now = moment(new Date());

            if(now.isAfter(expiry)){
                return ServiceResponse.error(res, null, "Token expired. Please log in.", ResponseStatus.UNAUTHORIZED);
            }

            delete decodedJwt.iat;
            delete decodedJwt.exp;
        
            req.headers["user"] = decodedJwt;
            next();
        } catch (err) {
            logger.error(`Authentication error - ${err}`);
            return ServiceResponse.error(res, err, "Authentication error. Please contact support", ResponseStatus.UNAUTHORIZED);
        }
    }
}