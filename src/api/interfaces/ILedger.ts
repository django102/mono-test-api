import { Document } from "mongoose";

import { TransactionType } from "../enums";

interface ILedger extends Document {
    reference: string;
    accountNumber: string;
    credit: number;
    debit: number;
    narration: string;
    transactionType: TransactionType;
    isReversed: boolean;
    isDeleted: boolean;
}

export default ILedger;