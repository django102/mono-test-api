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
    ) { }

    static success<T = any, U = any>(
        res: Response,
        message?: string,
        data?: T,
        meta?: U,
        code: ResponseStatus = ResponseStatus.OK
    ) {
        return new ServiceResponse(res, true, code, message, data, meta);
    }

    static error(
        res: Response,
        err: any,
        message?: string,
        code?: ResponseStatus,
        data?: Record<any, any>
    ) {
        return new ServiceResponse(
            res,
            false,
            code || ResponseStatus.INTERNAL_SERVER_ERROR,
            message || err.message || "Oops; something went wrong, please try again later!",
            data
        );
    }
}