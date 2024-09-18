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
        const transaction = await Transaction.create({ ...transactionData, reference });
        
        return transaction;
    }

    public static async fetchTransaction(reference: string): Promise<ITransaction> {
        return (await Transaction.findOne({ reference })).toObject();
    }

    public static async fetchPendingDeduction(accountNumber: string): Promise<number> {
        const filter = {
            sourceAccountNumber: accountNumber,
            $nor: [
                { transactionStatus: TransactionStatus.NEW },
                { transactionStatus: TransactionStatus.SUCCESS },
                { transactionStatus: TransactionStatus.FAILED },
                { transactionStatus: TransactionStatus.REVERSED },
            ]
        };

        const pendingTransactions = await Transaction.find(filter);
        const pendingDebit = pendingTransactions.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0);
        return pendingDebit;
    }

    public static async updateTransaction(reference: string, transactionUpdateData: Partial<ITransaction>): Promise<ITransaction> {
        const updatedTransaction = await Transaction.findOneAndUpdate({ reference }, transactionUpdateData, { returnDocument: "after" });
        return updatedTransaction;
    }

    public static async initiateTransferTransaction(res: Response, sourceAccountNumber: string, destinationAccountNuber: string, amount: number): Promise<ServiceResponse> {
        try {
            const sourceLedgerBalance = await LedgerService.getBalance(sourceAccountNumber);
            const pendingDedit = await this.fetchPendingDeduction(sourceAccountNumber);
            const availableBalance = (sourceLedgerBalance.credit - sourceLedgerBalance.debit) - pendingDedit;
            if(availableBalance < amount) {
                return ServiceResponse.error(res, null, "Insufficient balance", ResponseStatus.BAD_REQUEST);
            }

            const transactionData: Partial<ITransaction> = {
                reference: UtilityService.generateTransactionReference(),
                sourceAccountNumber,
                destinationAccountNuber,
                amount,
                narration: `Funds transfer to ${destinationAccountNuber}`,
                transactionType: TransactionType.TRANSFER,
                transactionStatus: TransactionStatus.PENDING
            };

            const transaction = await this.createTransaction(transactionData);

            // Do some OTP or other validation thingy here

            return ServiceResponse.success(res, "Transaction created. Please enter OTP", transaction);
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }

    public static async updateTransferTransaction(res: Response, reference: string, transactionStatus: TransactionStatus): Promise<ServiceResponse> {
        try {
            // Assume OTP or other validation thingy is successful

            const transaction: ITransaction = await this.fetchTransaction(reference);
            if(!transaction) {
                return ServiceResponse.error(res, null, "Transaction not found", ResponseStatus.BAD_REQUEST);
            }

            const updatedTransaction = await this.updateTransaction(reference, { transactionStatus });
            if(transactionStatus === TransactionStatus.SUCCESS) {
                await LedgerService.postToLedger(updatedTransaction);
            }

            if(transactionStatus === TransactionStatus.REVERSED) {
                await LedgerService.reverseTransaction(updatedTransaction);
            }

            return ServiceResponse.success(res, "Transaction successfully updated", updatedTransaction);
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }
}