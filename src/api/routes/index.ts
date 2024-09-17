import { Router } from "express";

const router: Router = Router();


router.get("/", (req, res) => res.send({ message: "Welcome" }));


export default router;