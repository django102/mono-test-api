import bcrypt from "bcryptjs";

import UtilityService from "../../../src/api/services/UtilityService";


jest.mock("bcryptjs");


describe("UtilityService", () => {
    describe("padToTenDigits", () => {
        it("should pad number to 10 digits with leading zeros", () => {
            expect(UtilityService.padToTenDigits(123)).toBe("0000000123");
            expect(UtilityService.padToTenDigits(123456789)).toBe("0123456789");
            expect(UtilityService.padToTenDigits(0)).toBe("0000000000");
        });

        it("should return a string of length 10", () => {
            expect(UtilityService.padToTenDigits(123).length).toBe(10);
        });
    });

    describe("generateTransactionReference", () => {
        it("should generate a transaction reference in the correct format", () => {
            const reference = UtilityService.generateTransactionReference();
            const regex = /^mono-\d{14}\d{4}$/; // YYYYMMDDHHmmssSSSS
            expect(reference).toMatch(regex);
        });
    });

    describe("hashPassword", () => {
        it("should return an empty string for empty input", async () => {
            const result = await UtilityService.hashPassword("");
            expect(result).toBe("");
        });

        it("should hash the password correctly", async () => {
            const input = "myPassword";
            const hashedPassword = "hashedPassword";
            
            (bcrypt.genSalt as jest.Mock).mockResolvedValueOnce("salt");
            (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);

            const result = await UtilityService.hashPassword(input);
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith(input, "salt");
            expect(result).toBe(hashedPassword);
        });
    });

    describe("comparePassword", () => {
        it("should compare password and return true for matching passwords", async () => {
            const input = "myPassword";
            const hashedPassword = "hashedPassword";

            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

            const result = await UtilityService.comparePassword(input, hashedPassword);
            expect(bcrypt.compare).toHaveBeenCalledWith(input, hashedPassword);
            expect(result).toBe(true);
        });

        it("should compare password and return false for non-matching passwords", async () => {
            const input = "myPassword";
            const hashedPassword = "hashedPassword";

            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

            const result = await UtilityService.comparePassword(input, hashedPassword);
            expect(bcrypt.compare).toHaveBeenCalledWith(input, hashedPassword);
            expect(result).toBe(false);
        });
    });
});