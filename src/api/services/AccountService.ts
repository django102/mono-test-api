import { Response } from "express";
import moment from "moment";

import { env } from "../../env";
import { GLAccount, ResponseStatus, TransactionStatus, TransactionType } from "../enums";
import IAccount from "../interfaces/IAccount";
import ITransaction from "../interfaces/ITransaction";
import { ServiceResponse } from "../models/ServiceResponse";
import Account from "../models/mongo/Account";
import Counter from "../models/mongo/Counter";

import CustomerService from "./CustomerService";
import LedgerService from "./LedgerService";
import TransactionService from "./TransactionService";
import UtilityService from "./UtilityService";


const { config } = env;


export default class AccountService {
    private static async getNextAccountNumber(): Promise<string> {
        const counter = await Counter.findOneAndUpdate(
            { name: "accountNumber" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        return UtilityService.padToTenDigits(counter.seq);
    }

    public static async createAccount(customerId: string): Promise<{success: boolean, message?:string, account?: IAccount}> {
        if(!customerId) {
            return { success: false, message: "No customer selected" };
        }

        const isExceedsMaxAccountPerCustomer = await AccountService.isExceedsMaxAccountPerCustomer(customerId);
        if(isExceedsMaxAccountPerCustomer) {
            return { success: false, message: "Maximum number of accounts exceeded" };
        }

        const accountNumber = await this.getNextAccountNumber();

        const newAccount = await Account.create({
            accountNumber,
            customerId
        });

        const prefundingTransaction: Partial<ITransaction> = {
            reference: UtilityService.generateTransactionReference(),
            sourceAccountNumber: GLAccount.CUSTOMER_FUNDING,
            destinationAccountNuber: newAccount.accountNumber,
            amount: config.defaultAmountForNewAccounts,
            narration: "Funding for account creation",
            transactionType: TransactionType.FUNDING,
            transactionStatus: TransactionStatus.SUCCESS
        };
        
        const transaction: ITransaction = await TransactionService.createTransaction(prefundingTransaction);
        await LedgerService.postToLedger(transaction);

        return { success: true, account: newAccount };
    }

    public static async isExceedsMaxAccountPerCustomer(customerId: string): Promise<boolean> {
        const existingAccounts = await Account.find({ customerId }).countDocuments();
        return existingAccounts === config.maxAccounts;
    }

    public static async getAccount(res: Response, accountNumber: string): Promise<ServiceResponse> {
        try {
            const account = (await Account.findOne({ accountNumber })).toObject();
            if(!account) {
                return ServiceResponse.error(res, null, "Account does not exist", ResponseStatus.BAD_REQUEST);
            }

            const customer = await CustomerService.getCustomerInformation(account.customerId.toString());
            if(!customer) {
                return ServiceResponse.error(res, null, "No customer attached to this account", ResponseStatus.BAD_REQUEST);
            }

            return ServiceResponse.success(res, "Account information found", { accountNumber, name: `${customer.firstName} ${customer.lastName}` });
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }

    public static async getAccounts(customerId: string): Promise<IAccount[]> {
        return Account.find({ customerId });
    }

    public static async getAccountHistory(res: Response, accountNumber: string, fromDate?: string, toDate?: string): Promise<ServiceResponse> {
        try {
            const dateFrom = fromDate ? moment(fromDate).toDate() : null;
            const dateTo = toDate ? moment(toDate).toDate() : null;

            const transactionHistory = await LedgerService.getHistory(accountNumber, dateFrom, dateTo);
        
            return ServiceResponse.success(res, "Transaction history successfully retrieved", transactionHistory);
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }
}