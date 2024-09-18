import { ObjectId } from "mongodb";
import { Document } from "mongoose";


interface IAccount extends Document {
    customerId: ObjectId;
    accountNumber: string;
    isEnabled: boolean;
}

export default IAccount;