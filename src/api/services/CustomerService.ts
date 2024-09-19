import { Response } from "express";
import { Types } from "mongoose";

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
            const existingCustomer = await this.getCustomerInformation(null, customerData.email);
            if(existingCustomer) {
                return ServiceResponse.error(res, null, "Customer with email already exists", ResponseStatus.BAD_REQUEST);
            }

            const password = await UtilityService.hashPassword(customerData.password);
            const customer: ICustomer = await Customer.create({ ...customerData, password });
            return await this.handleAccountCreation(res, customer.id, "Customer created successfully", customer.toObject());
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }

    public static async createAdditionalAccount(res: Response, customerId: string): Promise<ServiceResponse> {
        try {
            const customer = await this.getCustomerInformation(customerId);
            if (!customer) {
                return ServiceResponse.error(res, null, "Customer not found", ResponseStatus.BAD_REQUEST);
            }
            return await this.handleAccountCreation(res, customer.id, "Customer account created successfully", customer);
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }

    public static async getCustomerInformation(customerId?: string, email?: string, returnAccounts: boolean = false): Promise<ICustomer | any> {
        if (!customerId && !email) return null;

        const customer = await Customer.findOne({
            $or: [
                { _id: new Types.ObjectId(customerId) },
                { email }
            ]
        });
        if (!customer) return null;

        const accounts = returnAccounts ? await AccountService.getAccounts(customerId) : [];
        return { ...customer.toObject(), accounts };
    }

    public static async updateCustomer(res: Response, customerId: string, updateData: Partial<ICustomer>): Promise<ServiceResponse> {
        try {
            const existingCustomer = await this.getCustomerInformation(customerId);
            if (!existingCustomer) {
                return ServiceResponse.error(res, null, "Customer not found", ResponseStatus.BAD_REQUEST);
            }

            const updatedCustomer = await Customer.findOneAndUpdate({ _id: existingCustomer._id }, updateData, { new: true });
            return ServiceResponse.success(res, "Customer updated successfully", updatedCustomer);
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }

    public static async authenticateCustomer(res: Response, email: string, password: string): Promise<ServiceResponse> {
        try {
            const customer = await this.getCustomerInformation(undefined, email, true);
            if(!customer || !(await UtilityService.comparePassword(password, customer.password))) {
                return ServiceResponse.error(res, null, "Invalid email or password", ResponseStatus.UNAUTHORIZED);
            }

            const token = AuthService.issueToken(customer);

            delete customer.password;

            return ServiceResponse.success(res, "Login successful", { customer, token });
        } catch (err) {
            return ServiceResponse.error(res, err);
        }
    }

    
    private static async handleAccountCreation(res: Response, customerId: string, successMessage: string, customer: ICustomer): Promise<ServiceResponse> {
        const { success, message, account } = await AccountService.createAccount(customerId);
        if (!success) {
            return ServiceResponse.error(res, null, message, ResponseStatus.BAD_REQUEST);
        }
        return ServiceResponse.success(res, successMessage, { ...customer, account });
    }
}