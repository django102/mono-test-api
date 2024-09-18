import { Document } from "mongoose";


interface ICustomer extends Document {
    firstName: string;
    lastName: string;
    address: string;
    phoneNumber: string;
    email: string;
    password: string;
    isEnabled: boolean;
}

export default ICustomer;