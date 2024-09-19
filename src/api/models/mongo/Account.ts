import { model, Schema } from "mongoose";

import IAccount from "../../interfaces/IAccount";


const accountSchema = new Schema(
    {
        customerId: { type: String, required: true },
        accountNumber: { type: String, required: true, unique: true },
        isEnabled: { type: Boolean, required: true, default: true },
    },
    { timestamps: true, collation: { locale: "en_US", strength: 2 } },
);

accountSchema.index({ customerId: 1 });
accountSchema.index({ accountNumber: 1 });

// Create a virtual property `id` that mirrors `_id`
accountSchema.virtual("id").get(function () {
    return this._id.toString();
});
  
// Ensure virtual fields are serialized to JSON
accountSchema.set("toJSON", {
    virtuals: true
});
accountSchema.set("toObject", {
    virtuals: true
});


const Account = model<IAccount>("account", accountSchema);
export default Account;
