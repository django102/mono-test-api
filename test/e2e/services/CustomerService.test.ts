import { Response } from "express";
import { Types } from "mongoose";

import { ResponseStatus } from "../../../src/api/enums";
import { ServiceResponse } from "../../../src/api/models/ServiceResponse";
import Customer from "../../../src/api/models/mongo/Customer";
import AccountService from "../../../src/api/services/AccountService";
import AuthService from "../../../src/api/services/AuthService";
import CustomerService from "../../../src/api/services/CustomerService";
import UtilityService from "../../../src/api/services/UtilityService";


const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};


describe("CustomerService", () => {
    let hashPasswordMock: jest.SpyInstance;
    let customerCreateMock: jest.SpyInstance;
    let getCustomerInformationMock: jest.SpyInstance;
    let createAccountMock: jest.SpyInstance;
    let customerFindOneMock: jest.SpyInstance;
    let getAccountsMock: jest.SpyInstance;
    let customerFindOneAndUpdate: jest.SpyInstance;
    let comparePasswordMock: jest.SpyInstance;
    let issueTokenMock: jest.SpyInstance;


    beforeEach(() => {
        hashPasswordMock = jest.spyOn(UtilityService, "hashPassword");
        customerCreateMock = jest.spyOn(Customer, "create");
        getCustomerInformationMock = jest.spyOn(CustomerService, "getCustomerInformation");
        createAccountMock = jest.spyOn(AccountService, "createAccount");
        customerFindOneMock = jest.spyOn(Customer, "findOne");
        getAccountsMock = jest.spyOn(AccountService, "getAccounts");
        customerFindOneAndUpdate = jest.spyOn(Customer, "findOneAndUpdate");
        comparePasswordMock = jest.spyOn(UtilityService, "comparePassword");
        issueTokenMock = jest.spyOn(AuthService, "issueToken");
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe("handleAccountCreation", () => {
        it("should successfully handle account creation", async () => {
            const res = mockResponse();
            const customerId = "12345";
            const successMessage = "Account created successfully";
    
            createAccountMock.mockResolvedValue({
                success: true,
                message: "Account created",
                account: { accountNumber: "ACC123" },
            });

            const result = await (CustomerService as any).handleAccountCreation(res, customerId, successMessage, { _id: 12, email: "me@you.com", password: "myPass" });

            expect(createAccountMock).toHaveBeenCalledWith(customerId);
            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual({ _id: 12, email: "me@you.com", account: { accountNumber: "ACC123" } });
        });
    });

    describe("createCustomer", () => {
        it("should create a customer successfully", async () => {
            const res = mockResponse();
            const customerData = { email: "test@example.com", password: "password123" };
            const hashedPassword = "hashedPassword";
            const createdCustomer = { _id: "customerId", ...customerData, password: hashedPassword };

            getCustomerInformationMock.mockResolvedValue(null);
            hashPasswordMock.mockResolvedValue(hashedPassword);
            const toObjectMock = jest.fn().mockReturnValue(createdCustomer);
            customerCreateMock.mockResolvedValue({ toObject: toObjectMock });
            (CustomerService as any).handleAccountCreation = jest.fn().mockResolvedValue(ServiceResponse.success(res, "OK", { ...createdCustomer, account: {} }));

            const result = await CustomerService.createCustomer(res, customerData);

            expect(getCustomerInformationMock).toHaveBeenCalledWith(null, customerData.email);
            expect(hashPasswordMock).toHaveBeenCalledWith(customerData.password);
            expect(customerCreateMock).toHaveBeenCalledWith({ ...customerData, password: hashedPassword });
            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual({ ...createdCustomer, account: {} });
        });

        it("should fail is customer already exists", async () => {
            const res = mockResponse();
            const customerData = { email: "test@example.com", password: "password123" };

            getCustomerInformationMock.mockResolvedValue(customerData);

            const result = await CustomerService.createCustomer(res, customerData);

            expect(getCustomerInformationMock).toHaveBeenCalledWith(null, customerData.email);
            expect(hashPasswordMock).not.toHaveBeenCalled();
            expect(customerCreateMock).not.toHaveBeenCalled();
            expect(result.code).toBe(ResponseStatus.BAD_REQUEST);
        });

        it("should return an error if customer creation fails", async () => {
            const res = mockResponse();
            const customerData = { email: "test@example.com", password: "password123" };
            const errorMessage = "Error creating customer";

            getCustomerInformationMock.mockResolvedValue(null);
            hashPasswordMock.mockResolvedValue("hashedPassword");
            customerCreateMock.mockRejectedValue(new Error(errorMessage));

            const result = await CustomerService.createCustomer(res, customerData);

            expect(result.code).toBe(ResponseStatus.INTERNAL_SERVER_ERROR);
        });
    });

    describe("createAdditionalAccount", () => {
        it("should create an additional account for an existing customer", async () => {
            const res = mockResponse();
            const customerId = "customerId";
            const existingCustomer = { id: customerId };

            getCustomerInformationMock.mockResolvedValue(existingCustomer);
            (CustomerService as any).handleAccountCreation = jest.fn().mockResolvedValue(ServiceResponse.success(res, "OK", { ...existingCustomer, account: {} }));

            const result = await CustomerService.createAdditionalAccount(res, customerId);

            expect(getCustomerInformationMock).toHaveBeenCalledWith(customerId);
            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual({ ...existingCustomer, account: {} });
        });

        it("should return an error if the customer does not exist", async () => {
            const res = mockResponse();
            const customerId = "nonExistentId";

            getCustomerInformationMock.mockResolvedValue(null);

            const result = await CustomerService.createAdditionalAccount(res, customerId);

            expect(getCustomerInformationMock).toHaveBeenCalledWith(customerId);
            expect(result.code).toBe(ResponseStatus.BAD_REQUEST);
        });

        it("should return an error if account creation fails", async () => {
            const res = mockResponse();
            const customerId = "customerId";
            const existingCustomer = { id: customerId };

            getCustomerInformationMock.mockResolvedValue(existingCustomer);
            (CustomerService as any).handleAccountCreation = jest.fn().mockResolvedValue(ServiceResponse.error(res, null, "Error creating account", ResponseStatus.BAD_REQUEST));

            const result = await CustomerService.createAdditionalAccount(res, customerId);

            expect(result.code).toBe(ResponseStatus.BAD_REQUEST);
        });

        it("should handle errors gracefully during authentication process", async () => {
            const res = mockResponse();
            const customerId = "customerId";

            getCustomerInformationMock
                .mockRejectedValue(new Error("Database error"));

            const result = await CustomerService.createAdditionalAccount(res, customerId);

            expect(result.code).toBe(ResponseStatus.INTERNAL_SERVER_ERROR);
        });
    });

    describe("getCustomerInformation", () => {
        it("should return customer information with accounts when found by ID", async () => {
            const customerId = "66eb89cc97314af96d762205";
            const mockAccounts = [{ id: "account1" }, { id: "account2" }];
            
            customerFindOneMock.mockResolvedValue({ toObject: jest.fn().mockReturnValue({ id: customerId }) });
            getAccountsMock.mockResolvedValue(mockAccounts);

            const result = await CustomerService.getCustomerInformation(customerId, undefined, true);

            expect(customerFindOneMock).toHaveBeenCalledWith({
                $or: [{ _id: new Types.ObjectId(customerId) }, { email: undefined }]
            });
            expect(getAccountsMock).toHaveBeenCalledWith(customerId);
            expect(result).toEqual({ id: customerId, accounts: mockAccounts });
        });

        it("should return customer information with accounts when found by ID, without returning customer accounts", async () => {
            const customerId = "66eb89cc97314af96d762205";
            
            customerFindOneMock.mockResolvedValue({ toObject: jest.fn().mockReturnValue({ id: customerId }) });

            const result = await CustomerService.getCustomerInformation(customerId, undefined, false);

            expect(customerFindOneMock).toHaveBeenCalledWith({
                $or: [{ _id: new Types.ObjectId(customerId) }, { email: undefined }]
            });
            expect(getAccountsMock).not.toHaveBeenCalled();
            expect(result).toEqual({ id: customerId, accounts: [] });
        });

        it("should return null if no ID or email is provided", async () => {
            const result = await CustomerService.getCustomerInformation();

            expect(result).toBeNull();
        });

        it("should return null if no customer is found by ID or email", async () => {
            const customerId = "66eb89cc97314af96d762205";
            customerFindOneMock.mockResolvedValue(null);

            const resultById = await CustomerService.getCustomerInformation(customerId);
            
            expect(resultById).toBeNull();
        });
    });

    describe("updateCustomer", () => {
        it("should update an existing customer's information successfully", async () => {
            const res = mockResponse();
            const customerId = "66eb89cc97314af96d762205";
            const updateData = { email: "newemail@example.com" };
            
            getCustomerInformationMock.mockResolvedValue({ _id: customerId });
            const toObjectMock = jest.fn().mockReturnValue({ ...updateData, _id: customerId });
            customerFindOneAndUpdate.mockResolvedValue({ toObject: toObjectMock });

            const result = await CustomerService.updateCustomer(res, customerId, updateData);

            expect(customerFindOneAndUpdate).toHaveBeenCalledWith({ _id: customerId }, updateData, { new: true });
            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual({ ...updateData, _id: customerId });
        });

        it("should return an error if the customer does not exist during update", async () => {
            const res = mockResponse();
            const customerId = "66eb89cc97314af96d762205";

            getCustomerInformationMock.mockResolvedValue(null);

            const result = await CustomerService.updateCustomer(res, customerId, {});

            expect(result.code).toBe(ResponseStatus.BAD_REQUEST);
        });

        it("should return an error if update fails", async () => {
            const res = mockResponse();
            const customerId = "66eb89cc97314af96d762205";

            getCustomerInformationMock.mockResolvedValue({ id: customerId });
            customerFindOneAndUpdate.mockRejectedValue(new Error("Update failed"));

            const result = await CustomerService.updateCustomer(res, customerId, {});

            expect(result.code).toBe(ResponseStatus.INTERNAL_SERVER_ERROR);
        });
    });

    describe("authenticateCustomer", () => {
        it("should authenticate a valid customer and issue a token", async () => {
            const res = mockResponse();
            const email = "test@example.com";
            const password = "password123";
            const hashedPassword = await UtilityService.hashPassword(password); // Assuming this returns a promise
           
            comparePasswordMock.mockReturnValue(true); 
            getCustomerInformationMock
                .mockResolvedValueOnce({
                    email,
                    password: hashedPassword,
                    id: "customer-id"
                });
            issueTokenMock
                .mockReturnValue("token");

            const result = await CustomerService.authenticateCustomer(res, email, password);

            expect(getCustomerInformationMock)
                .toHaveBeenCalledWith(undefined, email, true);
            expect(comparePasswordMock)
                .toHaveBeenCalledWith(password, hashedPassword);
            expect(issueTokenMock)
                .toHaveBeenCalledWith({ email, id: "customer-id" });
            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual({ customer: { email, id: "customer-id" }, token: "token" });
        });

        it("should return an error for invalid credentials during authentication", async () => {
            const res = mockResponse();
            const email = "test@example.com";
            const password = "wrongpassword";

            comparePasswordMock
                .mockReturnValue(false); 
            getCustomerInformationMock
                .mockResolvedValueOnce({
                    email,
                    password,
                    id: "customer-id"
                });

            const result = await CustomerService.authenticateCustomer(res, email, password);

            expect(getCustomerInformationMock)
                .toHaveBeenCalledWith(undefined, email, true);
            expect(comparePasswordMock)
                .toHaveBeenCalledWith(password, password); 
            expect(result.code).toBe(ResponseStatus.UNAUTHORIZED);
        });

        it("should handle errors gracefully during authentication process", async () => {
            const res = mockResponse();
            const email = "test@example.com";
            const password = "password123";

            getCustomerInformationMock
                .mockRejectedValue(new Error("Database error"));

            const result = await CustomerService.authenticateCustomer(res, email, password);

            expect(result.code).toBe(ResponseStatus.INTERNAL_SERVER_ERROR);
        });
    });
});