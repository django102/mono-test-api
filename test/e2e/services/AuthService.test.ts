import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { ResponseStatus } from "../../../src/api/enums";
import AuthService from "../../../src/api/services/AuthService";


jest.mock("jsonwebtoken");


const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockRequest = () => {
    return {
        headers: {},
    } as Request;
};

const mockNext = jest.fn() as NextFunction;


describe("AuthService", () => {
    let verifyTokenMock: jest.SpyInstance;

    
    beforeEach(() => {
        verifyTokenMock = jest.spyOn(AuthService, "verifyToken");
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });


    describe("issueToken", () => {
        it("should issue a token successfully", () => {
            const data = { id: "userId" };
            const token = "mockedToken";

            (jwt.sign as jest.Mock).mockReturnValue(token);

            const result = AuthService.issueToken(data);

            expect(jwt.sign).toHaveBeenCalledWith(data, expect.any(String), { expiresIn: "1h" });
            expect(result).toBe(token);
        });

        it("should return null if no data is provided", () => {
            const result = AuthService.issueToken(null);

            expect(result).toBeNull();
        });
    });

    describe("verifyToken", () => {
        it("should verify a valid token", () => {
            const token = "validToken";
            const decodedData = { id: "userId" };

            (jwt.verify as jest.Mock).mockReturnValue(decodedData);

            const result = AuthService.verifyToken(token);

            expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
            expect(result).toEqual(decodedData);
        });

        it("should return null for an invalid token", () => {
            const token = "invalidToken";

            (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error(); });

            const result = AuthService.verifyToken(token);

            expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
            expect(result).toBeNull();
        });
    });

    describe("validateAuthentication", () => {
        it("should call next if the token is valid", () => {
            const req = mockRequest();
            const res = mockResponse();
            const decodedJwt = { id: "userId" };
            req.headers.authorization = "Bearer validToken";

            verifyTokenMock.mockReturnValue(decodedJwt);

            AuthService.validateAuthentication(req, res, mockNext);

            expect(verifyTokenMock).toHaveBeenCalledWith("validToken");
            expect(req.headers.user).toEqual(decodedJwt);
            expect(mockNext).toHaveBeenCalled();
        });

        it("should return unauthorized response if authorization header is missing", () => {
            const req = mockRequest();
            const res = mockResponse();

            const result: any = AuthService.validateAuthentication(req, res, mockNext);

            expect(result.code).toBe(ResponseStatus.UNAUTHORIZED);
            expect(result.message).toBe("Authorization header missing or invalid format");
        });

        it("should return unauthorized response if token is missing", () => {
            const req = mockRequest();
            const res = mockResponse();
            req.headers.authorization = "Bearer ";

            const result: any = AuthService.validateAuthentication(req, res, mockNext);

            expect(result.code).toBe(ResponseStatus.UNAUTHORIZED);
            expect(result.message).toBe("Token missing");
        });

        it("should return unauthorized response if token is invalid or expired", () => {
            const req = mockRequest();
            const res = mockResponse();
            req.headers.authorization = "Bearer invalidToken";

            verifyTokenMock.mockReturnValue(null);

            const result: any = AuthService.validateAuthentication(req, res, mockNext);

            expect(result.code).toBe(ResponseStatus.UNAUTHORIZED);
            expect(result.message).toBe("Invalid or expired token");
        });
    });
});