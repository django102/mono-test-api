import { Response } from "express";

import { ResponseStatus } from "../../../src/api/enums";
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
    let accountCreateMock: jest.SpyInstance;
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
        accountCreateMock = jest.spyOn(AccountService, "createAccount");
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


    describe("createCustomer", () => {
        it("should create a customer successfully", async () => {
            const res = mockResponse();
            const customerData = { email: "test@example.com", password: "password123" };
            const hashedPassword = "hashedPassword";
            const createdCustomer = { id: "customerId", ...customerData, password: hashedPassword };

            hashPasswordMock.mockResolvedValue(hashedPassword);
            customerCreateMock.mockResolvedValue(createdCustomer);
            accountCreateMock.mockResolvedValue({ success: true, account: {} });

            const result = await CustomerService.createCustomer(res, customerData);

            expect(hashPasswordMock).toHaveBeenCalledWith(customerData.password);
            expect(customerCreateMock).toHaveBeenCalledWith({ ...customerData, password: hashedPassword });
            expect(createAccountMock).toHaveBeenCalledWith(createdCustomer.id);
            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual({ ...createdCustomer, account: {} });
        });

        it("should return an error if customer creation fails", async () => {
            const res = mockResponse();
            const customerData = { email: "test@example.com", password: "password123" };
            const errorMessage = "Error creating customer";

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
            createAccountMock.mockResolvedValue({ success: true, account: {} });

            const result = await CustomerService.createAdditionalAccount(res, customerId);

            expect(getCustomerInformationMock).toHaveBeenCalledWith(customerId);
            expect(createAccountMock).toHaveBeenCalledWith(customerId);
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
            createAccountMock.mockResolvedValue({ success: false, message: "Error creating account" });

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
            const customerId = "customerId";
            const mockAccounts = [{ id: "account1" }, { id: "account2" }];
            
            customerFindOneMock.mockResolvedValue({ toObject: jest.fn().mockReturnValue({ id: customerId }) });
            getAccountsMock.mockResolvedValue(mockAccounts);

            const result = await CustomerService.getCustomerInformation(customerId, undefined, true);

            expect(customerFindOneMock).toHaveBeenCalledWith({
                $or: [{ id: customerId }, { email: undefined }]
            });
            expect(getAccountsMock).toHaveBeenCalledWith(customerId);
            expect(result).toEqual({ id: customerId, accounts: mockAccounts });
        });

        it("should return customer information with accounts when found by ID, without returning customer accounts", async () => {
            const customerId = "customerId";
            
            customerFindOneMock.mockResolvedValue({ toObject: jest.fn().mockReturnValue({ id: customerId }) });

            const result = await CustomerService.getCustomerInformation(customerId, undefined, false);

            expect(customerFindOneMock).toHaveBeenCalledWith({
                $or: [{ id: customerId }, { email: undefined }]
            });
            expect(getAccountsMock).not.toHaveBeenCalled();
            expect(result).toEqual({ id: customerId, accounts: [] });
        });

        it("should return null if no ID or email is provided", async () => {
            const result = await CustomerService.getCustomerInformation();

            expect(result).toBeNull();
        });

        it("should return null if no customer is found by ID or email", async () => {
            customerFindOneMock.mockResolvedValue(null);

            const resultById = await CustomerService.getCustomerInformation("nonExistentId");
            
            expect(resultById).toBeNull();
        });
    });

    describe("updateCustomer", () => {
        it("should update an existing customer's information successfully", async () => {
            const res = mockResponse();
            const customerId = "customerId";
            const updateData = { email: "newemail@example.com" };
            
            getCustomerInformationMock.mockResolvedValue({ id: customerId });
            
            customerFindOneAndUpdate.mockResolvedValue({ ...updateData, id: customerId });

            const result = await CustomerService.updateCustomer(res, customerId, updateData);

            expect(customerFindOneAndUpdate).toHaveBeenCalledWith({ id: customerId }, updateData, { new: true });
            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual({ ...updateData, id: customerId });
        });

        it("should return an error if the customer does not exist during update", async () => {
            const res = mockResponse();
            const customerId = "nonExistentId";

            getCustomerInformationMock.mockResolvedValue(null);

            const result = await CustomerService.updateCustomer(res, customerId, {});

            expect(result.code).toBe(ResponseStatus.BAD_REQUEST);
        });

        it("should return an error if update fails", async () => {
            const res = mockResponse();
            const customerId = "customerId";

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