import bcrypt from "bcryptjs";
import moment from "moment";


export default class UtilityService {
    public static padToTenDigits(num: number): string {
        return num.toString().padStart(10, "0");  // Pad with leading zeros to make it 10 digits
    }

    public static generateTransactionReference(): string {
        const uniqueReferenceIdentifier = moment().format("YYYYMMDDhhmmssSS");
        const reference = `mono-${uniqueReferenceIdentifier}`;
        return reference;
    }

    public static async hashPassword(input: string): Promise<string> {
        if (!input) {
            return "";
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(input, salt);

        return hashedPassword;
    }

    public static async comparePassword(input: string, hashedPassword: string): Promise<boolean> {
        const isSame = await bcrypt.compare(input, hashedPassword);
        return isSame;
    }
}