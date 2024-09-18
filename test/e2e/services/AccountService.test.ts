import { Response } from "express";

import { ResponseStatus } from "../../../src/api/enums";
import Account from "../../../src/api/models/mongo/Account";
import Counter from "../../../src/api/models/mongo/Counter";
import AccountService from "../../../src/api/services/AccountService";
import CustomerService from "../../../src/api/services/CustomerService";
import LedgerService from "../../../src/api/services/LedgerService";
import TransactionService from "../../../src/api/services/TransactionService";


const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};


describe("AccountService", () => {
    let isExceedsMaxAccountPerCustomerMock: jest.SpyInstance;
    // let getNextAccountNumberMock: jest.SpyInstance;
    let counterFindOneAndUpdateMock: jest.SpyInstance;
    let accountCreateMock: jest.SpyInstance;
    let createTransactionMock: jest.SpyInstance;
    let postToLedgerMock: jest.SpyInstance;
    let accountCountDocumentsMock: jest.SpyInstance;
    let accountFindOneMock: jest.SpyInstance;
    let accountFindMock: jest.SpyInstance;
    let getCustomerInformationMock: jest.SpyInstance;
    let getHistoryMock: jest.SpyInstance;


    beforeEach(() => {
        isExceedsMaxAccountPerCustomerMock = jest.spyOn(AccountService, "isExceedsMaxAccountPerCustomer");
        counterFindOneAndUpdateMock = jest.spyOn(Counter, "findOneAndUpdate");
        accountCreateMock = jest.spyOn(Account, "create");
        createTransactionMock = jest.spyOn(TransactionService, "createTransaction");
        postToLedgerMock = jest.spyOn(LedgerService, "postToLedger");
        accountCountDocumentsMock = jest.spyOn(Account, "countDocuments");
        accountFindOneMock = jest.spyOn(Account, "findOne");
        accountFindMock = jest.spyOn(Account, "find");
        getCustomerInformationMock = jest.spyOn(CustomerService, "getCustomerInformation");
        getHistoryMock = jest.spyOn(LedgerService, "getHistory");
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });


    describe("getNextAccountNumber", () => {
        it("should return a padded account number", async () => {
            const seq = 1;
            const leanMock = jest.fn().mockResolvedValue({ seq });
            const selectMock = jest.fn().mockReturnValue({ lean: leanMock });
            counterFindOneAndUpdateMock.mockReturnValue({ select: selectMock });

            const result = await (AccountService as any).getNextAccountNumber();
            expect(result).toBe("0000000001"); // Assuming padToTenDigits pads to 10 digits
        });
    });

    describe("createAccount", () => {
        it("should create an account successfully", async () => {
            const customerId = "customerId";
            const accountNumber = "0000000002"; // Example padded account number
            const newAccount = { accountNumber, customerId };
            
            isExceedsMaxAccountPerCustomerMock.mockResolvedValue(false);
            (AccountService as any).getNextAccountNumber = jest.fn().mockResolvedValue(accountNumber);
            accountCreateMock.mockResolvedValue(newAccount);
            createTransactionMock.mockResolvedValue({});
            postToLedgerMock.mockResolvedValue({});

            const result = await AccountService.createAccount(customerId);

            expect(result.success).toBe(true);
            expect(result.account).toEqual(newAccount);
        });

        it("should return an error if no customerId is provided", async () => {
            const result = await AccountService.createAccount("");

            expect(result.success).toBe(false);
            expect(result.message).toBe("No customer selected");
        });

        it("should return an error if maximum accounts exceeded", async () => {
            const customerId = "customerId";

            isExceedsMaxAccountPerCustomerMock.mockResolvedValue(true);

            const result = await AccountService.createAccount(customerId);

            expect(result.success).toBe(false);
            expect(result.message).toBe("Maximum number of accounts exceeded");
        });
    });

    describe("isExceedsMaxAccountPerCustomer", () => {
        it("should return true if the maximum number of accounts is exceeded", async () => {
            const customerId = "customerId";

            const leanMock = jest.fn().mockResolvedValue({ id: 1, accountNumber: "00001" });
            accountFindOneMock.mockReturnValue({ lean: leanMock });
            accountCountDocumentsMock.mockResolvedValue(5); // Assuming maxAccounts is 5

            const result = await AccountService.isExceedsMaxAccountPerCustomer(customerId);

            expect(result).toBe(true);
        });

        it("should return false if the maximum number of accounts is not exceeded", async () => {
            const customerId = "customerId";

            const leanMock = jest.fn().mockResolvedValue({ id: 1, accountNumber: "00001" });
            accountFindOneMock.mockReturnValue({ lean: leanMock });
            accountCountDocumentsMock.mockResolvedValue(3); // Assuming maxAccounts is 5

            const result = await AccountService.isExceedsMaxAccountPerCustomer(customerId);

            expect(result).toBe(false);
        });
    });

    describe("getAccount", () => {
        it("should return account information if found", async () => {
            const res = mockResponse();
            const accountNumber = "account123";
            const accountData = { accountNumber, customerId: "customerId" };
            const customerData = { firstName: "John", lastName: "Doe" };

            const leanMock = jest.fn().mockResolvedValue(accountData);
            accountFindOneMock.mockReturnValue({ lean: leanMock });
            getCustomerInformationMock.mockResolvedValue(customerData);

            const result = await AccountService.getAccount(res, accountNumber);

            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual({ accountNumber, name: "John Doe" });
        });

        it("should return an error if the account does not exist", async () => {
            const res = mockResponse();
            const accountNumber = "nonExistent";

            const leanMock = jest.fn().mockResolvedValue(null);
            accountFindOneMock.mockReturnValue({ lean: leanMock });

            const result = await AccountService.getAccount(res, accountNumber);

            expect(result.code).toBe(ResponseStatus.BAD_REQUEST);
            expect(result.message).toBe("Account does not exist");
        });

        it("should return an error if no customer is attached to the account", async () => {
            const res = mockResponse();
            const accountNumber = "account123";
            const accountData = { accountNumber, customerId: "nonExistent" };

            const leanMock = jest.fn().mockResolvedValue(accountData);
            accountFindOneMock.mockReturnValue({ lean: leanMock });
            getCustomerInformationMock.mockResolvedValue(null);

            const result = await AccountService.getAccount(res, accountNumber);

            expect(result.code).toBe(ResponseStatus.BAD_REQUEST);
            expect(result.message).toBe("No customer attached to this account");
        });

        it("should handle errors when returning a list of accounts for a given customer ID", async () => {
            const res = mockResponse();
            const accountNumber = "account123";

            const leanMock = jest.fn().mockRejectedValue(new Error("Some error here"));
            accountFindOneMock.mockReturnValue({ lean: leanMock });

            const result = await AccountService.getAccount(res, accountNumber);

            expect(result.code).toBe(ResponseStatus.INTERNAL_SERVER_ERROR);
        });
    });

    describe("getAccounts", () => {
        it("should return a list of accounts for a given customer ID", async () => {
            const customerId = "customerId";
            const accountsList = [{ accountNumber: "account1" }, { accountNumber: "account2" }];

            const leanMock = jest.fn().mockResolvedValue(accountsList);
            accountFindMock.mockReturnValue({ lean: leanMock });

            const result = await AccountService.getAccounts(customerId);

            expect(result).toEqual(accountsList);
        });
    });

    describe("getAccountHistory", () => {
        it("should retrieve transaction history successfully", async () => {
            const res = mockResponse();
            const accountNumber = "account123";
            const transactionHistory = [{ id: 1 }, { id: 2 }];

            getHistoryMock.mockResolvedValue(transactionHistory);

            const result = await AccountService.getAccountHistory(res, accountNumber);

            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual(transactionHistory);
        });

        it("should retrieve transaction history successfully, with date filters", async () => {
            const res = mockResponse();
            const accountNumber = "account123";
            const transactionHistory = [{ id: 1 }, { id: 2 }];
            const fromDate = "2020-01-01";
            const toDate = "2020-02-01";

            getHistoryMock.mockResolvedValue(transactionHistory);

            const result = await AccountService.getAccountHistory(res, accountNumber, fromDate, toDate);

            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual(transactionHistory);
        });

        it("should handle errors when retrieving transaction history", async () => {
            const res = mockResponse();
            const accountNumber = "account123";

            getHistoryMock.mockRejectedValue(new Error("Error fetching history"));

            const result = await AccountService.getAccountHistory(res, accountNumber);

            expect(result.code).toBe(ResponseStatus.INTERNAL_SERVER_ERROR);
        });
    });
});