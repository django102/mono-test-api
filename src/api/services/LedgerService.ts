import ILedger from "../interfaces/ILedger";
import ITransaction from "../interfaces/ITransaction";
import Ledger from "../models/mongo/Ledger";

export default class LedgerService {
    public static async postToLedger(transaction: Partial<ITransaction>) {
        const entries = this.createLedgerEntries(transaction);
        await Ledger.insertMany(entries);
    }

    public static async reverseTransaction(transaction: Partial<ITransaction>) {
        const existingLedgerEntries = await Ledger.find({ reference: transaction.reference });
        if (existingLedgerEntries.length === 0) return;

        await Ledger.updateMany({ reference: transaction.reference }, { isReversed: true });
        
        const reversedEntries = this.createReversedLedgerEntries(transaction);
        await Ledger.insertMany(reversedEntries);
    }

    public static async getBalance(accountNumber: string): Promise<{credit: number, debit: number}> {
        const result = await Ledger.aggregate([
            {
                $match: {
                    accountNumber,
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: "$accountNumber",
                    totalDebit: { $sum: "$debit" },
                    totalCredit: { $sum: "$credit" }
                }
            }
        ]);

        return result.length > 0
            ? { debit: result[0].totalDebit, credit: result[0].totalCredit }
            : { debit: 0, credit: 0 };
    }

    public static async getHistory(accountNumber: string, fromDate?: Date, toDate?: Date): Promise<ILedger[]> {
        const filter = this.buildHistoryFilter(accountNumber, fromDate, toDate);
        return await Ledger.find(filter);
    }


    private static buildHistoryFilter(accountNumber: string, fromDate?: Date, toDate?: Date) {
        return {
            accountNumber,
            ...(fromDate && { createdAt: { $gte: fromDate } }),
            ...(toDate && { createdAt: { $lte: toDate } }),
        };
    }

    private static createLedgerEntries(transaction: Partial<ITransaction>): Partial<ILedger>[] {
        return [
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
    }

    private static createReversedLedgerEntries(transaction: Partial<ITransaction>): Partial<ILedger>[] {
        return [
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
    }
}