import { model, Schema } from "mongoose";

import { TransactionStatus, TransactionType } from "../../enums";
import ITransaction from "../../interfaces/ITransaction";


const transactionSchema = new Schema(
    {
        reference: { type: String, required: true, unique: true },
        sourceAccountNumber: { type: String, required: true },
        destinationAccountNumber: { type: String, required: true },
        amount: { type: Number, required: true },
        narration: { type: String, required: true },
        transactionType: { type: String, enum: Object.values(TransactionType), required: true },
        transactionStatus: { type: String, enum: Object.values(TransactionStatus), required: true },
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

// Create a virtual property `id` that mirrors `_id`
transactionSchema.virtual("id").get(function () {
    return this._id.toString();
});
  
// Ensure virtual fields are serialized to JSON
transactionSchema.set("toJSON", {
    virtuals: true
});
transactionSchema.set("toObject", {
    virtuals: true
});

const Transaction = model<ITransaction>("transaction", transactionSchema);
export default Transaction;