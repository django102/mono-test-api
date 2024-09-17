import { Document, model, Schema } from "mongoose";

interface ICounter extends Document {
    name: string;
    seq: number;
}

const counterSchema = new Schema({
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 1000000000 }  // Start the sequence at 1,000,000,000
});


const Counter = model<ICounter>("counter", counterSchema);
export default Counter;
