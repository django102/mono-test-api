import { Request, Response } from "express";

import ResponseHandler from "../handlers/ResponseHandler";
import AccountService from "../services/AccountService";


export default class AccountController {
    public static async getAccount(req: Request, res: Response): Promise<Response> {
        const accountNumber = req.params.account;

        const response = await AccountService.getAccount(res, accountNumber);
        return ResponseHandler.handleResponse(res, response);
    }

    public static async getAccountHistory(req: Request, res: Response): Promise<Response> {
        const { account, fromDate, toDate } = req.query as any;
        
        const response = await AccountService.getAccountHistory(res, account, fromDate, toDate);
        return ResponseHandler.handleResponse(res, response);
    }
}