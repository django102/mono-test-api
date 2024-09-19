import { NextFunction, Request, Response } from "express";
import Joi, { ObjectSchema } from "joi";

import { ResponseStatus, TransactionStatus } from "../enums";
import ResponseHandler from "../handlers/ResponseHandler";
import { ServiceResponse } from "../models/ServiceResponse";


export default class ValidationService {
    public static validateCustomerRequest(req: Request, res: Response, next: NextFunction): Response | void {
        const customer = req.body;
        
        const schema: ObjectSchema = Joi.object({
            firstName: Joi.string().required().messages({ "any.required": "First Name is required" }),
            lastName: Joi.string().required().messages({ "any.required": "Last Name is required" }),
            email: Joi.string().email().messages({ "string.email": "Please provide a valid email address", "string.empty": "Email is required" }),
            password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9\\W]{8,}$")).messages({ "string.pattern.base": "Password must be at least 8 characters long and contain only letters and numbers.", "string.empty": "Password cannot be empty." }),
        });

        const { error } = schema.validate(customer);
        if(error) {
            return ResponseHandler.handleResponse(res, ServiceResponse.error(res, null, error.message, ResponseStatus.BAD_REQUEST));
        }
        
        next();
    }

    public static validateAuthenticationRequest(req: Request, res: Response, next: NextFunction): Response | void {
        const loginRequest = req.body;
        
        const schema: ObjectSchema = Joi.object({
            email: Joi.string().email().messages({ "string.empty": "Email is required" }),
            password: Joi.string().required().messages({ "string.empty": "Password cannot be empty." }),
        });

        const { error } = schema.validate(loginRequest);
        if(error) {
            return ResponseHandler.handleResponse(res, ServiceResponse.error(res, null, error.message, ResponseStatus.BAD_REQUEST));
        }
        
        next();
    }

    public static validateTransactionHistoryRequest(req: Request, res: Response, next: NextFunction): Response | void {
        const queryRequest = req.query;

        const schema: ObjectSchema = Joi.object({
            account: Joi.string().required().messages({ "any.required": "'account' query parameter is required." }),
        });

        const { error } = schema.validate(queryRequest);
        if(error) {
            return ResponseHandler.handleResponse(res, ServiceResponse.error(res, null, error.message, ResponseStatus.BAD_REQUEST));
        }
        
        next();
    }

    public static validateInitiateTransferTransaction(req: Request, res: Response, next: NextFunction): Response | void {
        const transferRequest = req.body;

        const schema: ObjectSchema = Joi.object({
            sourceAccountNumber: Joi.string().required().messages({ "any.required": "Source Account Number is required." }),
            destinationAccountNumber: Joi.string().required().messages({ "any.required": "Destination Account Number is required." }),
            amount: Joi.number().min(1).messages({ "number.base": "Amount must be a number.", "number.min": "Your minimum amount must be ₦1.", }),
        });

        const { error } = schema.validate(transferRequest);
        if(error) {
            return ResponseHandler.handleResponse(res, ServiceResponse.error(res, null, error.message, ResponseStatus.BAD_REQUEST));
        }
        
        next();
    }

    public static validateUpdateTransferTransaction(req: Request, res: Response, next: NextFunction): Response | void {
        const updateTransferRequest = req.body;

        const schema: ObjectSchema = Joi.object({
            reference: Joi.string().required().messages({ "any.required": "Transaction Reference is required." }),
            transactionStatus: Joi.string().valid(...Object.values(TransactionStatus)).messages({ "any.required": "Transaction Status is required.", "any.only": `Transaction Status must be one of the following: ${Object.values(TransactionStatus).join(", ")}` }),
        });

        const { error } = schema.validate(updateTransferRequest);
        if(error) {
            return ResponseHandler.handleResponse(res, ServiceResponse.error(res, null, error.message, ResponseStatus.BAD_REQUEST));
        }
        
        next();
    }
}