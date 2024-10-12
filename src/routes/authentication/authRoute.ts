import { Router } from "express";
import { createUser } from "../../controllers/authentication/registerUserController";

const authRouter: Router = Router();

authRouter.post("/register", createUser);

export default authRouter;
