import { Response } from "express";

import { ResponseStatus, TransactionStatus, TransactionType } from "../enums";
import ITransaction from "../interfaces/ITransaction";
import { ServiceResponse } from "../models/ServiceResponse";
import Transaction from "../models/mongo/Transaction";

import LedgerService from "./LedgerService";
import UtilityService from "./UtilityService";


export default class TransactionService {
    public static async createTransaction(transactionData: Partial<ITransaction>): Promise<ITransaction> {
        const reference = UtilityService.generateTransactionReference();
        return await Transaction.create({ ...transactionData, reference });
    }

    public static async fetchTransaction(reference: string): Promise<ITransaction | null> {
        const transaction = await Transaction.findOne({ reference });
        return transaction ? transaction.toObject() : null;
    }

    public static async fetchPendingDeduction(accountNumber: string): Promise<number> {
        const filter = {
            sourceAccountNumber: accountNumber,
            transactionStatus: { $nin: [TransactionStatus.NEW, TransactionStatus.SUCCESS, TransactionStatus.FAILED, TransactionStatus.REVERSED] }
        };

        const pendingTransactions = await Transaction.find(filter);
        return pendingTransactions.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0);
    }

    public static async updateTransaction(reference: string, transactionUpdateData: Partial<ITransaction>): Promise<ITransaction | null> {
        return await Transaction.findOneAndUpdate({ reference }, transactionUpdateData, { new: true });
    }

    public static async initiateTransferTransaction(res: Response, sourceAccountNumber: string, destinationAccountNumber: string, amount: number): Promise<ServiceResponse> {
        try {
            const sourceLedgerBalance = await LedgerService.getBalance(sourceAccountNumber);
            const pendingDebit = await this.fetchPendingDeduction(sourceAccountNumber);
            const availableBalance = (sourceLedgerBalance.credit - sourceLedgerBalance.debit) - pendingDebit;

            if (availableBalance < amount) {
                return ServiceResponse.error(res, null, "Insufficient balance", ResponseStatus.BAD_REQUEST);
            }

            const transactionData: Partial<ITransaction> = {
                reference: UtilityService.generateTransactionReference(),
                sourceAccountNumber,
                destinationAccountNumber,
                amount,
                narration: `Funds transfer to ${destinationAccountNumber}`,
                transactionType: TransactionType.TRANSFER,
                transactionStatus: TransactionStatus.PENDING
            };

            const transaction = await this.createTransaction(transactionData);

            // Do some OTP or other validation here

            return ServiceResponse.success(res, "Transaction created. Please enter OTP", transaction);
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }

    public static async updateTransferTransaction(res: Response, reference: string, transactionStatus: TransactionStatus): Promise<ServiceResponse> {
        try {
            // Assume OTP or other validation is successful

            const transaction = await this.fetchTransaction(reference);
            if (!transaction) {
                return ServiceResponse.error(res, null, "Transaction not found", ResponseStatus.BAD_REQUEST);
            }

            const updatedTransaction = await this.updateTransaction(reference, { transactionStatus });
            if (transactionStatus === TransactionStatus.SUCCESS) {
                await LedgerService.postToLedger(updatedTransaction);
            } else if (transactionStatus === TransactionStatus.REVERSED) {
                await LedgerService.reverseTransaction(updatedTransaction);
            }

            return ServiceResponse.success(res, "Transaction successfully updated", updatedTransaction);
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }
}