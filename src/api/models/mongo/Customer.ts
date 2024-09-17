import { Document, model, Schema } from "mongoose";

interface ICustomer extends Document {
    firstName: string;
    lastName: string;
    address: string;
    phoneNumber: string;
    email: string;
    password: string;
    isEnabled: boolean;
}


const customerSchema = new Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        address: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isEnabled: { type: Boolean, required: true, default: true },
    },
    { timestamps: true, collation: { locale: "en_US", strength: 2 } },
);

customerSchema.index({ email: 1 });


const Customer = model<ICustomer>("customer", customerSchema);
export default Customer;
