import { Response } from "express";

import { ResponseStatus } from "../enums";
import ICustomer from "../interfaces/ICustomer";
import { ServiceResponse } from "../models/ServiceResponse";
import Customer from "../models/mongo/Customer";

import AccountService from "./AccountService";
import AuthService from "./AuthService";
import UtilityService from "./UtilityService";


export default class CustomerService {
    public static async createCustomer(res:Response, customerData: Partial<ICustomer>): Promise<ServiceResponse> {
        try {
            const password = UtilityService.hashPassword(customerData.password);
            const customer: ICustomer = await Customer.create({ ...customerData, password });
            const { success, message, account } = await AccountService.createAccount(customer.id);
            if(!success) {
                return ServiceResponse.error(res, null, message, ResponseStatus.BAD_REQUEST);
            }

            return ServiceResponse.success(res, "Customer created successfully", { ...customer, account });
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }

    public static async createAdditionalAccount(res: Response, customerId: string): Promise<ServiceResponse> {
        try {
            const customer:ICustomer = await this.getCustomerInformation(customerId);
            if(!customer) {
                return ServiceResponse.error(res, null, "Customer not found", ResponseStatus.NOT_FOUND);
            }

            const { success, message, account } = await AccountService.createAccount(customer.id);
            if(!success) {
                return ServiceResponse.error(res, null, message, ResponseStatus.BAD_REQUEST);
            }

            return ServiceResponse.success(res, "Customer account created successfully", { ...customer, account });
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }

    public static async getCustomerInformation(customerId?: string, email?: string, returnAccounts: boolean = false): Promise<ICustomer | any> {
        if(!customerId && !email) return null;

        const customer = await Customer.findOne({
            $or: [
                { id: customerId }, 
                { email: email }
            ]
        });

        if(!customer) return null;

        const accounts = returnAccounts ? await AccountService.getAccounts(customer.id) : [];

        return { ...customer.toObject(), accounts };
    }

    public static async updateCustomer(res: Response, customerId: string, updateData: Partial<ICustomer>): Promise<ServiceResponse> {
        try {
            const existingCustomer: ICustomer = await this.getCustomerInformation(customerId);
            if(!existingCustomer) {
                return ServiceResponse.error(res, null, "Customer not found", ResponseStatus.BAD_REQUEST);
            }

            const updatedCustomer = await Customer.findOneAndUpdate({ id: customerId }, updateData, { returnDocument: "after" });
            return ServiceResponse.success(res, "Customer updated successfully", updatedCustomer);
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }

    public static async authenticateCustomer(res: Response, email: string, password: string): Promise<ServiceResponse> {
        try {
            const customer = await this.getCustomerInformation(null, email, true);
            if(!customer) {
                return ServiceResponse.error(res, null, "Invalid email or password", ResponseStatus.UNAUTHORIZED);
            }

            const isPasswordAMatch = UtilityService.comparePassword(password, customer.password);
            if(!isPasswordAMatch) {
                return ServiceResponse.error(res, null, "Invalid email or password", ResponseStatus.UNAUTHORIZED);
            }

            const jwt = AuthService.issueToken(customer);

            return ServiceResponse.success(res, "Login successful", { customer, token: jwt });
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }
}