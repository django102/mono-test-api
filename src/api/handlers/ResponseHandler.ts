import { ResponseStatus } from "../enums";
import { Response } from "express";
import ApiResponse from "../response";
import { ServiceResponse } from "../models/ServiceResponse";
import logger from "../../lib/logger";


export default class ResponseHandler {
    private static successResponse(res: Response, response: ServiceResponse) {
        return ApiResponse.success(res, response.code, response.message, response.data, response.meta)
    }

    private static errorResponse(res: Response, err: any) {
        logger.error(err);
        return ApiResponse.error(res, ResponseStatus.INTERNAL_SERVER_ERROR, err.message)
    }

    public static handleResponse(res: Response, response: ServiceResponse) {
        return response.status ? ResponseHandler.successResponse(res, response) : ResponseHandler.errorResponse(res, response.err)
    }
}