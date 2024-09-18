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
        const { seq } = await Counter.findOneAndUpdate(
            { name: "accountNumber" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        ).select("seq").lean();  // Use lean for performance (no mongoose document overhead)
        
        return UtilityService.padToTenDigits(seq);
    }


    public static async createAccount(customerId: string): Promise<{success: boolean, message?:string, account?: IAccount}> {
        if(!customerId) {
            return { success: false, message: "No customer selected" };
        }

        // Parallelize checking for account limit and generating account number
        const [isExceedsMax, accountNumber] = await Promise.all([
            this.isExceedsMaxAccountPerCustomer(customerId),
            this.getNextAccountNumber()
        ]);

        if (isExceedsMax) {
            return { success: false, message: "Maximum number of accounts exceeded" };
        }

        // Create account and pre-funding transaction in parallel
        const newAccount = await Account.create({ accountNumber, customerId });

        const prefundingTransaction: Partial<ITransaction> = {
            reference: UtilityService.generateTransactionReference(),
            sourceAccountNumber: GLAccount.CUSTOMER_FUNDING,
            destinationAccountNumber: newAccount.accountNumber,
            amount: config.defaultAmountForNewAccounts,
            narration: "Funding for account creation",
            transactionType: TransactionType.FUNDING,
            transactionStatus: TransactionStatus.SUCCESS
        };

        const transactionPromise = TransactionService.createTransaction(prefundingTransaction);

        // Post to ledger once the transaction is created
        await LedgerService.postToLedger(await transactionPromise);

        return { success: true, account: newAccount };
    }

    public static async isExceedsMaxAccountPerCustomer(customerId: string): Promise<boolean> {
        // Use lean and limit(1) to efficiently check existence without counting all documents
        const existingAccounts = await Account.findOne({ customerId }).lean();
        return !!existingAccounts && (await Account.countDocuments({ customerId })) >= config.maxAccounts;
    }

    public static async getAccount(res: Response, accountNumber: string): Promise<ServiceResponse> {
        try {
            const account = await Account.findOne({ accountNumber }).lean();
            if (!account) {
                return ServiceResponse.error(res, null, "Account does not exist", ResponseStatus.BAD_REQUEST);
            }

            const customer = await CustomerService.getCustomerInformation(account.customerId.toString());
            if (!customer) {
                return ServiceResponse.error(res, null, "No customer attached to this account", ResponseStatus.BAD_REQUEST);
            }

            const { firstName, lastName } = customer;
            return ServiceResponse.success(res, "Account information found", { accountNumber, name: `${firstName} ${lastName}` });
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }

    public static async getAccounts(customerId: string): Promise<IAccount[]> {
        return Account.find({ customerId }).lean();  // Use lean for performance since we only need plain objects
    }

    public static async getAccountHistory(res: Response, accountNumber: string, fromDate?: string, toDate?: string): Promise<ServiceResponse> {
        try {
            // Simplify date parsing
            const dateFrom = fromDate ? moment(fromDate).startOf("day").toDate() : undefined;
            const dateTo = toDate ? moment(toDate).endOf("day").toDate() : undefined;

            const transactionHistory = await LedgerService.getHistory(accountNumber, dateFrom, dateTo);
            return ServiceResponse.success(res, "Transaction history successfully retrieved", transactionHistory);
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }
}