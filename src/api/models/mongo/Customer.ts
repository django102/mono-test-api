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


const Customer = model<ICustomer>("customer", customerSchema);
export default Customer;
