import bcrypt from "bcryptjs";
import moment from "moment";


export default class UtilityService {
    public static padToTenDigits(num: number): string {
        return num.toString().padStart(10, "0");  // Pad with leading zeros to make it 10 digits
    }

    public static generateTransactionReference(): string {
        return `mono-${moment().format("YYYYMMDDHHmmssSSSS")}`;
    }

    public static async hashPassword(input: string): Promise<string> {
        if (!input) return ""; // Early return for empty input

        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(input, salt);
    }

    public static async comparePassword(input: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(input, hashedPassword);
    }
}