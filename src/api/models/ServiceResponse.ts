import { Response } from "express";

import { ResponseStatus } from "../enums";

export class ServiceResponse<T = any, U = any> {
    constructor(
        public res: Response,
        public status: boolean,
        public code: ResponseStatus,
        public message?: string,
        public data?: T,
        public meta?: U,
        public err?: any
    ) {}

    
    static success<T = any, U = any>(
        res: Response,
        message?: string,
        data?: T,
        meta?: U,
        code: ResponseStatus = ResponseStatus.OK
    ): ServiceResponse<T, U> {
        return new ServiceResponse(res, true, code, message, data, meta);
    }

    static error<U = any>(
        res: Response,
        err: any,
        message?: string,
        code: ResponseStatus = ResponseStatus.INTERNAL_SERVER_ERROR,
        data?: Record<string, any>
    ): ServiceResponse<any, U> {
        const errorMessage = message || err.message || "Oops; something went wrong, please try again later!";
        
        return new ServiceResponse(
            res,
            false,
            code,
            errorMessage,
            data
        );
    }
}