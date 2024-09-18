import { model, Schema } from "mongoose";

import { TransactionType } from "../../enums";
import ILedger from "../../interfaces/ILedger";


const ledgerSchema = new Schema(
    {
        reference: { type: String, required: true },
        accountNumber: { type: String, required: true },
        credit: { type: Number, required: true },
        debit: { type: Number, required: true },
        narration: { type: String, required: true },
        transactionType: { type: String, enum: Object.values(TransactionType), required: true },
        isReversed: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, collation: { locale: "en_US", strength: 2 }, collection: "ledger" },
);

ledgerSchema.index({ reference: 1 });
ledgerSchema.index({ accountNumber: 1 });
ledgerSchema.index({ transactionType: 1 });


const Ledger = model<ILedger>("ledger", ledgerSchema);
export default Ledger;