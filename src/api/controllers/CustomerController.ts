import { Request, Response } from "express";

import ResponseHandler from "../handlers/ResponseHandler";
import CustomerService from "../services/CustomerService";


export default class CustomerController {
    public static async createCustomer(req: Request, res: Response): Promise<Response> {
        const response = await CustomerService.createCustomer(res, req.body);
        return ResponseHandler.handleResponse(res, response);
    }

    public static async createAdditionalAccount(req: Request, res: Response): Promise<Response> {
        const authenticatedUser = req.headers["user"] as any;
        
        const response = await CustomerService.createAdditionalAccount(res, authenticatedUser._id);
        return ResponseHandler.handleResponse(res, response);
    }

    public static async updateCustomer(req: Request, res: Response): Promise<Response> {
        const authenticatedUser = req.headers["user"] as any;
        
        const response = await CustomerService.updateCustomer(res, authenticatedUser.id, req.body);
        return ResponseHandler.handleResponse(res, response);
    }

    public static async authenticateCustomer(req: Request, res: Response): Promise<Response> {
        const { email, password } = req.body;

        const response = await CustomerService.authenticateCustomer(res, email, password);
        return ResponseHandler.handleResponse(res, response);
    }
}