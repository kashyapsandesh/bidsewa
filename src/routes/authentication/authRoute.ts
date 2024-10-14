import { Router } from "express";
import {
  changePassword,
  createUser,
  forgetpassword,
  loginUser,
  logoutUser,
  myInfo,
  resetpassword,
  verifyOtp,
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
authRouter.post("/forgetpassword", forgetpassword);
authRouter.post("/resetpassword/", resetpassword);
authRouter.post("/verify-forgetpassword-token", verifyOtp);
authRouter.post("/change-password", isAuthenticated, changePassword);
export default authRouter;
