import { Response } from "express";

import logger from "../../lib/logger";
import { ResponseStatus } from "../enums";
import { ServiceResponse } from "../models/ServiceResponse";
import ApiResponse from "../response";


export default class ResponseHandler {
    private static successResponse(res: Response, response: ServiceResponse) {
        return ApiResponse.success(res, response.code, response.message, response.data, response.meta);
    }

    private static errorResponse(res: Response, err: any, code: ResponseStatus = ResponseStatus.INTERNAL_SERVER_ERROR) {
        logger.error(err);
        return ApiResponse.error(res, code, err.message);
    }

    public static handleResponse(res: Response, response: ServiceResponse) {
        if(response.status) {
            return ResponseHandler.successResponse(res, response);
        }
        else {
            if(!response.err) {
                response.err = new Error(response.message);
            }

            return ResponseHandler.errorResponse(res, response.err, response.code);
        }
        // return response.status ? ResponseHandler.successResponse(res, response) : ResponseHandler.errorResponse(res, response.err);
    }
}