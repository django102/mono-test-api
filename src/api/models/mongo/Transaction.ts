import { Document, model, Schema } from "mongoose";

import { TransactionStatus, TransactionType } from "../../../api/enums";


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


const transactionSchema = new Schema(
    {
        reference: { type: String, required: true },
        sourceAccountNumber: { type: String, required: true },
        destinationAccountNumber: { type: String, required: true },
        amount: { type: Number, required: true },
        narration: { type: String, required: true },
        transactionType: { type: TransactionType, required: true },
        transactionStatus: { type: TransactionStatus, required: true },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, collation: { locale: "en_US", strength: 2 } },
);

transactionSchema.index({ reference: 1 });
transactionSchema.index({ sourceAccountNumber: 1 });
transactionSchema.index({ destinationAccountNumber: 1 });
transactionSchema.index({ amount: 1 });
transactionSchema.index({ transactionType: 1 });
transactionSchema.index({ transactionStatus: 1 });


const Transaction = model<ITransaction>("transaction", transactionSchema);
export default Transaction;