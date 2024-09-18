import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../env";
import { ResponseStatus } from "../enums";
import { ServiceResponse } from "../models/ServiceResponse";


const { hashtoken } = env.auth.jwt;


export default class AuthService {
    public static issueToken(data: object, expiresIn: string | number = "1h"): string | null {
        if (!data) return null;
        return jwt.sign(data, hashtoken, { expiresIn });
    }

    public static verifyToken(token: string): object | null {
        try {
            return jwt.verify(token, hashtoken); // jwt.verify handles token expiration internally
        } catch (err) {
            return null; // Return null if token is invalid or expired
        }
    }

    public static validateAuthentication(req: Request, res: Response, next: NextFunction): ServiceResponse | void {
        const authorization = req.headers.authorization;
        if (!authorization || !authorization.startsWith("Bearer ")) {
            return AuthService.UnauthorizedResponse(res, "Authorization header missing or invalid format");
        }

        const token = authorization.split(" ")[1];
        if (!token) {
            return AuthService.UnauthorizedResponse(res, "Token missing");
        }

        const decodedJwt = AuthService.verifyToken(token);
        if (!decodedJwt) {
            return AuthService.UnauthorizedResponse(res, "Invalid or expired token");
        }

        // Remove non-essential fields before passing user data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { iat, exp, ...user } = decodedJwt as any;

        req.headers["user"] = user;
        next();
    }

    
    private static UnauthorizedResponse(res: Response, message: string): ServiceResponse {
        return ServiceResponse.error(res, null, message, ResponseStatus.UNAUTHORIZED);
    }
}