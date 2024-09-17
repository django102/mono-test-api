import { ObjectId } from "mongodb";
import { Document, model, Schema } from "mongoose";

interface IAccount extends Document {
    customerId: ObjectId;
    accountNumber: string;
    isEnabled: boolean;
}


const accountSchema = new Schema(
    {
        customerId: { type: ObjectId, required: true },
        accountNumber: { type: String, required: true },
        isEnabled: { type: Boolean, required: true, default: true },
    },
    { timestamps: true, collation: { locale: "en_US", strength: 2 } },
);

accountSchema.index({ customerId: 1 });
accountSchema.index({ accountNumber: 1 });


const Account = model<IAccount>("account", accountSchema);
export default Account;
