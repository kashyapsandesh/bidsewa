"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const registerUserController_1 = require("../../controllers/authentication/registerUserController");
const authMiddleware_1 = require("../../middlewares/auth/authMiddleware");
const authRouter = (0, express_1.Router)();
authRouter.post("/register", registerUserController_1.createUser);
authRouter.post("/login", registerUserController_1.loginUser);
authRouter.get("/logout", registerUserController_1.logoutUser);
authRouter.get("/me", authMiddleware_1.isAuthenticated, (0, authMiddleware_1.authorizeRoles)("SELLER"), (req, res) => {
    res.send("Hello");
});
exports.default = authRouter;
