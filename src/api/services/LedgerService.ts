import ILedger from "../interfaces/ILedger";
import ITransaction from "../interfaces/ITransaction";
import Ledger from "../models/mongo/Ledger";

export default class LedgerService {
    public static async postToLedger(transaction: Partial<ITransaction>) {
        const debitEntry: Partial<ILedger> = {
            reference: transaction.reference,
            accountNumber: transaction.sourceAccountNumber,
            credit: 0,
            debit: transaction.amount,
            narration: transaction.narration,
            transactionType: transaction.transactionType
        };

        const creditEntry: Partial<ILedger> = {
            reference: transaction.reference,
            accountNumber: transaction.destinationAccountNuber,
            credit: transaction.amount,
            debit: 0,
            narration: transaction.narration,
            transactionType: transaction.transactionType
        };

        await Ledger.insertMany([debitEntry, creditEntry]);
    }

    public static async reverseTransaction(transaction: Partial<ITransaction>) {
        const existingLedgerEntries = await Ledger.find({ reference: transaction.reference });
        if(existingLedgerEntries.length === 0) return;

        await Ledger.updateMany({ reference: transaction.reference }, { isReversed: true });
        
        const debitEntry: Partial<ILedger> = {
            reference: transaction.reference,
            accountNumber: transaction.sourceAccountNumber,
            debit: 0,
            credit: transaction.amount,
            narration: transaction.narration,
            transactionType: transaction.transactionType,
            isReversed: true
        };

        const creditEntry: Partial<ILedger> = {
            reference: transaction.reference,
            accountNumber: transaction.destinationAccountNuber,
            debit: transaction.amount,
            credit: 0,
            narration: transaction.narration,
            transactionType: transaction.transactionType,
            isReversed: true
        };

        await Ledger.insertMany([debitEntry, creditEntry]);
    }

    public static async getBalance(accountNumber: string): Promise<{credit: number, debit: number}> {
        const result = await Ledger.aggregate([
            {
                $match: {
                    accountNumber: accountNumber, // Filter by the specific account number
                    isDeleted: false              // Exclude deleted records
                }
            },
            {
                $group: {
                    _id: "$accountNumber",        // Group by accountNumber
                    totalDebit: { $sum: "$debit" }, // Sum of debit
                    totalCredit: { $sum: "$credit" } // Sum of credit
                }
            }
        ]);

        if(result.length > 0) {
            return {
                debit: result[0].totalDebit,
                credit: result[0].totalDebit,
            };
        }

        return { debit: 0, credit: 0 };
    }

    public static async getHistory(accountNumber: string, fromDate?: Date, toDate?: Date): Promise<ILedger[]> {
        const filter = {
            accountNumber,
            ...(fromDate && { createdAt: { $gte: fromDate } }),
            ...(toDate && { createdAt: { $lte: toDate } }),
        };

        const transactionHistory = await Ledger.find(filter);
        return transactionHistory;
    }
}