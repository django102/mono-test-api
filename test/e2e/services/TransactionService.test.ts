import { ResponseStatus, TransactionStatus, TransactionType } from "../../../src/api/enums";
import Transaction from "../../../src/api/models/mongo/Transaction";
import LedgerService from "../../../src/api/services/LedgerService";
import TransactionService from "../../../src/api/services/TransactionService";
import UtilityService from "../../../src/api/services/UtilityService";


const mockResponse = () => {
    const res = {} as any;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};


describe("TransactionService", () => {
    let generateTransactionReferenceMock: jest.SpyInstance;
    let createTransactionMock: jest.SpyInstance;
    let findOneTransactionMock: jest.SpyInstance;
    let findTransactionMock: jest.SpyInstance;
    let findOneAndUpdateTransactionMock: jest.SpyInstance;
    let getLedgerBalanceMock: jest.SpyInstance;
    let fetchPendingDeductionMock: jest.SpyInstance;
    let fetchTransactionMock: jest.SpyInstance;
    let updateTransactionMock: jest.SpyInstance;
    let postToLedgerMock: jest.SpyInstance;
    let reverseTransactionMock: jest.SpyInstance;


    beforeEach(() => {
        generateTransactionReferenceMock = jest.spyOn(UtilityService, "generateTransactionReference");
        createTransactionMock = jest.spyOn(Transaction, "create");
        findOneTransactionMock = jest.spyOn(Transaction, "findOne");
        findTransactionMock = jest.spyOn(Transaction, "find");
        findOneAndUpdateTransactionMock = jest.spyOn(Transaction, "findOneAndUpdate");
        getLedgerBalanceMock = jest.spyOn(LedgerService, "getBalance");
        fetchPendingDeductionMock = jest.spyOn(TransactionService, "fetchPendingDeduction");
        fetchTransactionMock = jest.spyOn(TransactionService, "fetchTransaction");
        updateTransactionMock = jest.spyOn(TransactionService, "updateTransaction");
        postToLedgerMock = jest.spyOn(LedgerService, "postToLedger");
        reverseTransactionMock = jest.spyOn(LedgerService, "reverseTransaction");
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    
    
    describe("createTransaction", () => {
        it("should create a transaction with a generated reference", async () => {
            const transactionData = { amount: 100, sourceAccountNumber: "12345", destinationAccountNumber: "67890" };
            const generatedReference = "mono-202309181234560000"; // Mocked reference

            generateTransactionReferenceMock.mockReturnValue(generatedReference);
            createTransactionMock.mockResolvedValue(transactionData);
        
            const result = await TransactionService.createTransaction(transactionData);

            expect(createTransactionMock).toHaveBeenCalledWith({ ...transactionData, reference: generatedReference });
            expect(result).toEqual(transactionData);
        });
    });

    describe("fetchTransaction", () => {
        it("should return a transaction object when found", async () => {
            const reference = "mono-202309181234560000";

            const mockTransaction = { toObject: jest.fn().mockReturnValue({ amount: 100 }) };
            findOneTransactionMock.mockResolvedValue(mockTransaction);

            const result = await TransactionService.fetchTransaction(reference);
            expect(findOneTransactionMock).toHaveBeenCalledWith({ reference });
            expect(result).toEqual({ amount: 100 });
        });

        it("should return null when transaction is not found", async () => {
            const reference = "mono-202309181234560000";
            findOneTransactionMock.mockResolvedValue(null);

            const result = await TransactionService.fetchTransaction(reference);
            expect(findOneTransactionMock).toHaveBeenCalledWith({ reference });
            expect(result).toBeNull();
        });
    });

    describe("fetchPendingDeduction", () => {
        it("should return the total amount of pending deductions", async () => {
            const accountNumber = "12345";
            const pendingTransactions = [
                { amount: 50 },
                { amount: 30 },
                { amount: 20 }
            ];
            findTransactionMock.mockResolvedValue(pendingTransactions);

            const result = await TransactionService.fetchPendingDeduction(accountNumber);
            expect(findTransactionMock).toHaveBeenCalledWith({
                sourceAccountNumber: accountNumber,
                transactionStatus: { $nin: [TransactionStatus.NEW, TransactionStatus.SUCCESS, TransactionStatus.FAILED, TransactionStatus.REVERSED] }
            });
            expect(result).toBe(100); // 50 + 30 + 20
        });
    });

    describe("updateTransaction", () => {
        it("should update a transaction and return the updated transaction", async () => {
            const reference = "mono-202309181234560000";
            const updateData = { transactionStatus: TransactionStatus.SUCCESS };
            const updatedTransaction = { ...updateData, reference };
            
            findOneAndUpdateTransactionMock.mockResolvedValue(updatedTransaction);

            const result = await TransactionService.updateTransaction(reference, updateData);
            expect(findOneAndUpdateTransactionMock).toHaveBeenCalledWith({ reference }, updateData, { new: true });
            expect(result).toEqual(updatedTransaction);
        });
    });

    describe("initiateTransferTransaction", () => {
        it("should create a transfer transaction if sufficient balance exists", async () => {
            const res = mockResponse();
            const reference = "mono-202309181234560000";
            const sourceAccountNumber = "12345";
            const destinationAccountNumber = "67890";
            const amount = 100;
            const transactionData = {
                reference: "mono-202309181234560000",
                sourceAccountNumber,
                destinationAccountNumber,
                amount,
                narration: `Funds transfer to ${destinationAccountNumber}`,
                transactionType: TransactionType.TRANSFER,
                transactionStatus: TransactionStatus.PENDING
            };
            
            getLedgerBalanceMock.mockResolvedValue({ credit: 200, debit: 50 });
            fetchPendingDeductionMock.mockResolvedValue(30);           
            generateTransactionReferenceMock.mockReturnValue(reference);
            createTransactionMock.mockResolvedValue(transactionData);

            const result = await TransactionService.initiateTransferTransaction(res, sourceAccountNumber, destinationAccountNumber, amount);

            expect(getLedgerBalanceMock).toHaveBeenCalledWith(sourceAccountNumber);
            expect(fetchPendingDeductionMock).toHaveBeenCalledWith(sourceAccountNumber);
            expect(createTransactionMock).toHaveBeenCalledWith(transactionData);
            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual(transactionData);
        });

        it("should return an error response if there is insufficient balance", async () => {
            const res = mockResponse();
            const sourceAccountNumber = "12345";
            const destinationAccountNumber = "67890";
            const amount = 500;

            getLedgerBalanceMock.mockResolvedValue({ credit: 200, debit: 50 });
            fetchPendingDeductionMock.mockResolvedValue(30);

            const result = await TransactionService.initiateTransferTransaction(res, sourceAccountNumber, destinationAccountNumber, amount);

            expect(result.code).toBe(ResponseStatus.BAD_REQUEST);
        });

        it("should handle errors gracefully during update process", async () => {
            const res = mockResponse();
            const reference = "mono-202309181234560000";
            const sourceAccountNumber = "12345";
            const destinationAccountNumber = "67890";
            const amount = 100;
            const transactionData = {
                reference: "mono-202309181234560000",
                sourceAccountNumber,
                destinationAccountNumber,
                amount,
                narration: `Funds transfer to ${destinationAccountNumber}`,
                transactionType: TransactionType.TRANSFER,
                transactionStatus: TransactionStatus.PENDING
            };
 
            getLedgerBalanceMock.mockResolvedValue({ credit: 200, debit: 50 });
            fetchPendingDeductionMock.mockResolvedValue(30);           
            generateTransactionReferenceMock.mockReturnValue(reference);
            createTransactionMock.mockRejectedValue(new Error("Database error"));
 
            const result = await TransactionService.initiateTransferTransaction(res, sourceAccountNumber, destinationAccountNumber, amount);
 
            expect(getLedgerBalanceMock).toHaveBeenCalledWith(sourceAccountNumber);
            expect(fetchPendingDeductionMock).toHaveBeenCalledWith(sourceAccountNumber);
            expect(createTransactionMock).toHaveBeenCalledWith(transactionData);
            expect(result.code).toBe(ResponseStatus.INTERNAL_SERVER_ERROR);
        });
    });

    describe("updateTransferTransaction", () => {
        it("should update a transfer transaction successfully", async () => {
            const res = mockResponse();
            const reference = "mono-202309181234560000";
            const updatedData = { transactionStatus: TransactionStatus.SUCCESS };
            
            fetchTransactionMock.mockResolvedValue({ reference });
            updateTransactionMock.mockResolvedValue({ ...updatedData, reference });
            postToLedgerMock.mockResolvedValue(undefined);

            const result = await TransactionService.updateTransferTransaction(res, reference, TransactionStatus.SUCCESS);

            expect(TransactionService.fetchTransaction).toHaveBeenCalledWith(reference);
            expect(TransactionService.updateTransaction).toHaveBeenCalledWith(reference, updatedData);
            expect(LedgerService.postToLedger).toHaveBeenCalledWith({ ...updatedData, reference });
            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual({ ...updatedData, reference });
        });

        it("should return an error response if the transaction is not found", async () => {
            const res = mockResponse();
            const reference = "non-existent-reference";

            fetchTransactionMock.mockResolvedValue(null);

            const result = await TransactionService.updateTransferTransaction(res, reference, TransactionStatus.SUCCESS);

            expect(fetchTransactionMock).toHaveBeenCalledWith(reference);
            expect(result.code).toBe(ResponseStatus.BAD_REQUEST);
        });

        it("should reverse a transfer transaction successfully", async () => {
            const res = mockResponse();
            const reference = "mono-202309181234560000";
            const updatedData = { transactionStatus: TransactionStatus.REVERSED };
 
            fetchTransactionMock.mockResolvedValue({ reference });
            updateTransactionMock.mockResolvedValue({ ...updatedData, reference }); 
            reverseTransactionMock.mockResolvedValue(undefined);
 
            const result = await TransactionService.updateTransferTransaction(res, reference, TransactionStatus.REVERSED);
 
            expect(fetchTransactionMock).toHaveBeenCalledWith(reference);
            expect(updateTransactionMock).toHaveBeenCalledWith(reference, updatedData);
            expect(reverseTransactionMock).toHaveBeenCalledWith({ ...updatedData, reference });
            expect(result.code).toBe(ResponseStatus.OK);
            expect(result.data).toEqual({ ...updatedData, reference });
        });

        it("should handle errors gracefully during update process", async () => {
            const res = mockResponse();
            const reference = "mono-202309181234560000";
 
            fetchTransactionMock.mockRejectedValue(new Error("Database error"));
 
            const result = await TransactionService.updateTransferTransaction(res, reference, TransactionStatus.SUCCESS);
 
            expect(result.code).toBe(ResponseStatus.INTERNAL_SERVER_ERROR);
        });
    });
});