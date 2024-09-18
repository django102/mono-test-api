import { TransactionType } from "../../../src/api/enums";
import ITransaction from "../../../src/api/interfaces/ITransaction";
import Ledger from "../../../src/api/models/mongo/Ledger";
import LedgerService from "../../../src/api/services/LedgerService";


describe("LedgerService", () => {
    let ledgerInsertManyMock: jest.SpyInstance;
    let ledgerUpdateManyMock: jest.SpyInstance;
    let ledgerFindMock: jest.SpyInstance;
    let ledgerAggregateMock: jest.SpyInstance;


    beforeEach(() => {
        ledgerInsertManyMock = jest.spyOn(Ledger, "insertMany");
        ledgerUpdateManyMock = jest.spyOn(Ledger, "updateMany");
        ledgerFindMock = jest.spyOn(Ledger, "find");
        ledgerAggregateMock = jest.spyOn(Ledger, "aggregate");
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });


    describe("postToLedger", () => {
        it("should insert ledger entries for a transaction", async () => {
            const transaction: Partial<ITransaction> = {
                reference: "mono-202309181234560000",
                sourceAccountNumber: "12345",
                destinationAccountNumber: "67890",
                amount: 100,
                narration: "Transfer to 67890",
                transactionType: TransactionType.TRANSFER
            };

            const expectedEntries = [
                {
                    reference: transaction.reference,
                    accountNumber: transaction.sourceAccountNumber,
                    credit: 0,
                    debit: transaction.amount,
                    narration: transaction.narration,
                    transactionType: transaction.transactionType
                },
                {
                    reference: transaction.reference,
                    accountNumber: transaction.destinationAccountNumber,
                    credit: transaction.amount,
                    debit: 0,
                    narration: transaction.narration,
                    transactionType: transaction.transactionType
                }
            ];

            ledgerInsertManyMock.mockResolvedValue(null);

            await LedgerService.postToLedger(transaction);
            
            expect(ledgerInsertManyMock).toHaveBeenCalledWith(expectedEntries);
        });
    });

    describe("reverseTransaction", () => {
        it("should reverse existing ledger entries", async () => {
            const transaction: Partial<ITransaction> = {
                reference: "mono-202309181234560000",
                sourceAccountNumber: "12345",
                destinationAccountNumber: "67890",
                amount: 100,
                narration: "Transfer to 67890",
                transactionType: TransactionType.TRANSFER
            };

            const existingEntries = [
                { reference: transaction.reference, accountNumber: "12345", debit: 100, credit: 0 },
                { reference: transaction.reference, accountNumber: "67890", credit: 100, debit: 0 }
            ];

            const reversedEntries = [
                {
                    reference: transaction.reference,
                    accountNumber: transaction.sourceAccountNumber,
                    debit: 0,
                    credit: transaction.amount,
                    narration: transaction.narration,
                    transactionType: transaction.transactionType,
                    isReversed: true
                },
                {
                    reference: transaction.reference,
                    accountNumber: transaction.destinationAccountNumber,
                    debit: transaction.amount,
                    credit: 0,
                    narration: transaction.narration,
                    transactionType: transaction.transactionType,
                    isReversed: true
                }
            ];

            ledgerFindMock.mockResolvedValue(existingEntries);
            ledgerUpdateManyMock.mockResolvedValue(null);
            ledgerInsertManyMock.mockResolvedValue(null);

            await LedgerService.reverseTransaction(transaction);

            expect(ledgerFindMock).toHaveBeenCalledWith({ reference: transaction.reference });
            expect(ledgerUpdateManyMock).toHaveBeenCalledWith(
                { reference: transaction.reference },
                { isReversed: true }
            );
            expect(ledgerInsertManyMock).toHaveBeenCalledWith(reversedEntries);
        });

        it("should not reverse if no existing ledger entries are found", async () => {
            const transaction = { reference: "non-existent-reference" };
            ledgerFindMock.mockResolvedValue([]);

            await LedgerService.reverseTransaction(transaction);

            expect(ledgerUpdateManyMock).not.toHaveBeenCalled();
            expect(ledgerInsertManyMock).not.toHaveBeenCalled();
        });
    });

    describe("getBalance", () => {
        it("should return the balance for an account number", async () => {
            const accountNumber = "12345";
            const mockResult = [
                { _id: accountNumber, totalDebit: 200, totalCredit: 300 }
            ];

            ledgerAggregateMock.mockResolvedValue(mockResult);

            const result = await LedgerService.getBalance(accountNumber);
            
            expect(result).toEqual({ debit: 200, credit: 300 });
        });

        it("should return zero balance if no entries are found", async () => {
            const accountNumber = "12345";
            ledgerAggregateMock.mockResolvedValue([]);

            const result = await LedgerService.getBalance(accountNumber);
            
            expect(result).toEqual({ debit: 0, credit: 0 });
        });
    });

    describe("getHistory", () => {
        it("should return ledger history based on account number and date range", async () => {
            const accountNumber = "12345";
            const fromDate = new Date("2024-01-01");
            const toDate = new Date("2024-12-31");
            
            const mockHistory = [
                { accountNumber, createdAt: new Date("2024-06-01") },
                { accountNumber, createdAt: new Date("2024-07-01") }
            ];

            ledgerFindMock.mockResolvedValue(mockHistory);

            const result = await LedgerService.getHistory(accountNumber, fromDate, toDate);
            
            expect(result).toEqual(mockHistory);
        });

        it("should return ledger history without date range filters", async () => {
            const accountNumber = "12345";
            
            const mockHistory = [
                { accountNumber, createdAt: new Date() }
            ];

            ledgerFindMock.mockResolvedValue(mockHistory);

            const result = await LedgerService.getHistory(accountNumber);
            
            expect(result).toEqual(mockHistory);
        });
    });
});