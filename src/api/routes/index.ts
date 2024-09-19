import { Router } from "express";

import AccountController from "../controllers/AccountController";
import CustomerController from "../controllers/CustomerController";
import TransactionController from "../controllers/TransactionController";
import AuthService from "../services/AuthService";
import ValidationService from "../services/ValidationService";


const router: Router = Router();


router.get("/", (req, res) => res.send({ message: "Welcome" }));


router.post("/customer", ValidationService.validateCustomerRequest, CustomerController.createCustomer);
router.post("/customer/account", AuthService.validateAuthentication, CustomerController.createAdditionalAccount);
router.put("/customer", AuthService.validateAuthentication, ValidationService.validateCustomerRequest, CustomerController.updateCustomer);
router.post("/customer/login", ValidationService.validateAuthenticationRequest, CustomerController.authenticateCustomer);

router.get("/account/history", AuthService.validateAuthentication, ValidationService.validateTransactionHistoryRequest, AccountController.getAccountHistory);
router.get("/account/:account", AuthService.validateAuthentication, AccountController.getAccount);

router.post("/transaction/initialize", AuthService.validateAuthentication, ValidationService.validateInitiateTransferTransaction, TransactionController.initiateTransferTransaction);
router.post("/transaction/update", AuthService.validateAuthentication, ValidationService.validateUpdateTransferTransaction, TransactionController.updateTransferTransaction);

export default router;