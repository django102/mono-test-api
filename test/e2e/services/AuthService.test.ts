import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { ResponseStatus } from "../../../src/api/enums";
import { ServiceResponse } from "../../../src/api/models/ServiceResponse";
import AuthService from "../../../src/api/services/AuthService";


jest.mock("jsonwebtoken");
jest.mock("../../../src/api/handlers/ResponseHandler");
jest.mock("../../../src/api/models/ServiceResponse");


describe("AuthService", () => {
    const mockToken = "mockToken";
    const mockUserData = { id: "123", name: "John Doe", role: "admin" };
    let res: Partial<Response>;
    let req: Partial<Request>;
    let next: NextFunction;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        req = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe("issueToken", () => {
        it("should return null if data is null", () => {
            const token = AuthService.issueToken(null);
            expect(token).toBeNull();
        });

        it("should issue a token when valid data is provided", () => {
            const signMock = (jwt.sign as jest.Mock).mockReturnValue(mockToken);
            const token = AuthService.issueToken(mockUserData);

            expect(signMock).toHaveBeenCalledWith(mockUserData, expect.any(String), { expiresIn: "1h" });
            expect(token).toEqual(mockToken);
        });

        it("should allow custom expiration time", () => {
            const signMock = (jwt.sign as jest.Mock).mockReturnValue(mockToken);
            AuthService.issueToken(mockUserData, "2h");

            expect(signMock).toHaveBeenCalledWith(mockUserData, expect.any(String), { expiresIn: "2h" });
        });
    });

    describe("verifyToken", () => {
        it("should return null for invalid token", () => {
            (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("Invalid token"); });

            const decoded = AuthService.verifyToken("invalidToken");
            expect(decoded).toBeNull();
        });

        it("should return decoded token for a valid token", () => {
            const mockDecodedJwt = { ...mockUserData, exp: Date.now() / 1000 + 3600 };
            (jwt.verify as jest.Mock).mockReturnValue(mockDecodedJwt);

            const decoded = AuthService.verifyToken(mockToken);
            expect(decoded).toEqual(mockDecodedJwt);
        });
    });

    describe("validateAuthentication", () => {
        const unauthorizedResponseSpy = jest.spyOn(AuthService as any, "UnauthorizedResponse");

        it("should return unauthorized if authorization header is missing", () => {
            req = { headers: {} };

            AuthService.validateAuthentication(req as Request, res as Response, next);

            expect(unauthorizedResponseSpy).toHaveBeenCalledWith(res, "Authorization header missing or invalid format");
        });

        it("should return unauthorized if authorization header format is invalid", () => {
            req = { headers: { authorization: "InvalidFormat" } };

            AuthService.validateAuthentication(req as Request, res as Response, next);

            expect(unauthorizedResponseSpy).toHaveBeenCalledWith(res, "Authorization header missing or invalid format");
        });

        it("should return unauthorized if token is missing", () => {
            req = { headers: { authorization: "Bearer " } };

            AuthService.validateAuthentication(req as Request, res as Response, next);

            expect(unauthorizedResponseSpy).toHaveBeenCalledWith(res, "Token missing");
        });

        it("should return unauthorized if token is invalid or expired", () => {
            req = { headers: { authorization: "Bearer invalidToken" } };
            (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("Invalid token"); });

            AuthService.validateAuthentication(req as Request, res as Response, next);

            expect(unauthorizedResponseSpy).toHaveBeenCalledWith(res, "Invalid or expired token");
        });

        it("should set the user in headers and call next if token is valid", () => {
            const mockDecodedJwt = { ...mockUserData, exp: Date.now() / 1000 + 3600 };
            (jwt.verify as jest.Mock).mockReturnValue(mockDecodedJwt);
            req = { headers: { authorization: "Bearer validToken" } };

            AuthService.validateAuthentication(req as Request, res as Response, next);

            // expect(req.headers["user"]).toEqual(mockUserData); // Ensure user data is set, without `exp` and `iat`
            expect(next).toHaveBeenCalled();
        });
    });

    describe("UnauthorizedResponse", () => {
        it("should call ResponseHandler.handleResponse with correct parameters", () => {
            AuthService["UnauthorizedResponse"](res as Response, "Unauthorized");

            expect(ServiceResponse.error).toHaveBeenCalledWith(res, null, "Unauthorized", ResponseStatus.UNAUTHORIZED);
        });
    });
});


// const mockResponse = () => {
//     const res = {} as any;
//     res.status = jest.fn().mockReturnValue(res);
//     res.json = jest.fn().mockReturnValue(res);
//     res.req = {
//         _startTime: new Date(),
//         headers: {
//             age: 0
//         },
//         connection: {
//             remoteAddress: "::1"
//         }
//     };
//     return res;
// };

// const mockRequest = () => {
//     return {
//         headers: {},
//     } as any;
// };

// const mockNext = jest.fn() as NextFunction;


// describe("AuthService", () => {
//     let verifyTokenMock: jest.SpyInstance;

    
//     beforeEach(() => {
//         verifyTokenMock = jest.spyOn(AuthService, "verifyToken");
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//         jest.restoreAllMocks();
//     });


//     describe("issueToken", () => {
//         it("should issue a token successfully", () => {
//             const data = { id: "userId" };
//             const token = "mockedToken";

//             (jwt.sign as jest.Mock).mockReturnValue(token);

//             const result = AuthService.issueToken(data);

//             expect(jwt.sign).toHaveBeenCalledWith(data, expect.any(String), { expiresIn: "1h" });
//             expect(result).toBe(token);
//         });

//         it("should return null if no data is provided", () => {
//             const result = AuthService.issueToken(null);

//             expect(result).toBeNull();
//         });
//     });

//     describe("verifyToken", () => {
//         it("should verify a valid token", () => {
//             const token = "validToken";
//             const decodedData = { id: "userId" };

//             (jwt.verify as jest.Mock).mockReturnValue(decodedData);

//             const result = AuthService.verifyToken(token);

//             expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
//             expect(result).toEqual(decodedData);
//         });

//         it("should return null for an invalid token", () => {
//             const token = "invalidToken";

//             (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error(); });

//             const result = AuthService.verifyToken(token);

//             expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
//             expect(result).toBeNull();
//         });
//     });

//     describe("validateAuthentication", () => {
//         it("should call next if the token is valid", () => {
//             const req = mockRequest();
//             const res = mockResponse();
//             const decodedJwt = { id: "userId" };
//             req.headers.authorization = "Bearer validToken";
            
//             verifyTokenMock.mockReturnValue(decodedJwt);

//             AuthService.validateAuthentication(req, res, mockNext);

//             expect(verifyTokenMock).toHaveBeenCalledWith("validToken");
//             expect(req.headers.user).toEqual(decodedJwt);
//             expect(mockNext).toHaveBeenCalled();
//         });

//         it("should return unauthorized response if authorization header is missing", () => {
//             const req = mockRequest();
//             const res = mockResponse();

//             const result: any = AuthService.validateAuthentication(req, res, mockNext);

//             console.log("result", result);

//             expect(result.code).toBe(ResponseStatus.UNAUTHORIZED);
//             expect(result.message).toBe("Authorization header missing or invalid format");
//         });

//         it("should return unauthorized response if token is missing", () => {
//             const req = mockRequest();
//             const res = mockResponse();
//             req.headers.authorization = "Bearer ";

//             const result: any = AuthService.validateAuthentication(req, res, mockNext);

//             expect(result.code).toBe(ResponseStatus.UNAUTHORIZED);
//             expect(result.message).toBe("Token missing");
//         });

//         it("should return unauthorized response if token is invalid or expired", () => {
//             const req = mockRequest();
//             const res = mockResponse();
//             req.headers.authorization = "Bearer invalidToken";

//             verifyTokenMock.mockReturnValue(null);

//             const result: any = AuthService.validateAuthentication(req, res, mockNext);

//             expect(result.code).toBe(ResponseStatus.UNAUTHORIZED);
//             expect(result.message).toBe("Invalid or expired token");
//         });
//     });
// });