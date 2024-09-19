import { Request, Response } from "express";

import ResponseHandler from "../handlers/ResponseHandler";
import TransactionService from "../services/TransactionService";


export default class TransactionController {
    public static async initiateTransferTransaction(req: Request, res: Response): Promise<Response> {
        const { sourceAccountNumber, destinationAccountNumber, amount } = req.body;

        const response = await TransactionService.initiateTransferTransaction(res, sourceAccountNumber, destinationAccountNumber, amount);
        return ResponseHandler.handleResponse(res, response);
    }

    public static async updateTransferTransaction(req: Request, res: Response): Promise<Response> {
        const { reference, transactionStatus } = req.body;
        
        const response = await TransactionService.updateTransferTransaction(res, reference, transactionStatus);
        return ResponseHandler.handleResponse(res, response);
    }
}