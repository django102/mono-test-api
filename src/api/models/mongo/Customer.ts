import { model, Schema } from "mongoose";

import ICustomer from "../../interfaces/ICustomer";


const customerSchema = new Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        address: { type: String },
        phoneNumber: { type: String },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isEnabled: { type: Boolean, default: true },
    },
    { timestamps: true, collation: { locale: "en_US", strength: 2 } },
);

customerSchema.index({ id: 1 });
customerSchema.index({ email: 1 });

// Create a virtual property `id` that mirrors `_id`
customerSchema.virtual("id").get(function () {
    return this._id.toString();
});
  
// Ensure virtual fields are serialized to JSON
customerSchema.set("toJSON", {
    virtuals: true
});
customerSchema.set("toObject", {
    virtuals: true
});


const Customer = model<ICustomer>("customer", customerSchema);
export default Customer;
