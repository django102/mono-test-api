import { Document } from "mongoose";

import { TransactionStatus, TransactionType } from "../enums";


interface ITransaction extends Document {
    reference: string;
    sourceAccountNumber: string;
    destinationAccountNuber: string;
    amount: number;
    narration: string;
    transactionType: TransactionType;
    transactionStatus: TransactionStatus
    isDeleted: boolean;
}

export default ITransaction;