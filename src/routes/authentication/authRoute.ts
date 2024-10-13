import { Router } from "express";
import {
  createUser,
  loginUser,
  logoutUser,
  myInfo,
} from "../../controllers/authentication/registerUserController";
import {
  authorizeRoles,
  isAuthenticated,
} from "../../middlewares/auth/authMiddleware";

const authRouter: Router = Router();

authRouter.post("/register", createUser);
authRouter.post("/login", loginUser);
authRouter.get("/logout", logoutUser);
authRouter.get("/me", isAuthenticated, authorizeRoles("SELLER"), myInfo);

export default authRouter;
