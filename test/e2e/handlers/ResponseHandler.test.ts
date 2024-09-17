import { Response } from "express";

import { ResponseStatus } from "../../../src/api/enums";
import ResponseHandler from "../../../src/api/handlers/ResponseHandler";
import { ServiceResponse } from "../../../src/api/models/ServiceResponse";
import ApiResponse from "../../../src/api/response";
import logger from "../../../src/lib/logger";


jest.mock("../../../src/api/response");
jest.mock("../../../src/lib/logger");


describe("ResponseHandler", () => {
    let res: Partial<Response>;


    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });


    describe("successResponse", () => {
        it("should call ApiResponse.success with correct parameters", () => {
            const response: ServiceResponse = {
                res: res as any,
                status: true,
                code: ResponseStatus.OK,
                message: "Success",
                data: { key: "value" },
                meta: { page: 1 }
            };

            (ApiResponse.success as jest.Mock).mockReturnValue(res);

            ResponseHandler["successResponse"](res as Response, response);

            expect(ApiResponse.success).toHaveBeenCalledWith(
                res,
                response.code,
                response.message,
                response.data,
                response.meta
            );
        });
    });

    describe("errorResponse", () => {
        it("should call ApiResponse.error with correct parameters", () => {
            const error = new Error("Something went wrong");

            (ApiResponse.error as jest.Mock).mockReturnValue(res);

            ResponseHandler["errorResponse"](res as Response, error);

            expect(logger.error).toHaveBeenCalledWith(error);
            expect(ApiResponse.error).toHaveBeenCalledWith(
                res,
                ResponseStatus.INTERNAL_SERVER_ERROR,
                error.message
            );
        });
    });

    describe("handleResponse", () => {
        it("should call successResponse if response status is true", () => {
            const response: ServiceResponse = {
                res: res as any,
                status: true,
                code: ResponseStatus.OK,
                message: "Success",
                data: { key: "value" },
                meta: { page: 1 }
            };

            const successResponseSpy = jest.spyOn(ResponseHandler as any, "successResponse").mockReturnValue(res);

            ResponseHandler.handleResponse(res as Response, response);

            expect(successResponseSpy).toHaveBeenCalledWith(res, response);
        });

        it("should call errorResponse if response status is false", () => {
            const error = new Error("Something went wrong");
            const response: ServiceResponse = {
                res: res as any,
                status: false,
                code: ResponseStatus.INTERNAL_SERVER_ERROR,
                message: "Error",
                data: null,
                meta: null,
                err: error
            };

            const errorResponseSpy = jest.spyOn(ResponseHandler as any, "errorResponse").mockReturnValue(res);

            ResponseHandler.handleResponse(res as Response, response);

            expect(errorResponseSpy).toHaveBeenCalledWith(res, response.err);
        });
    });
});