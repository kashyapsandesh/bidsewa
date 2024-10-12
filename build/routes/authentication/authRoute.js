"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const registerUserController_1 = require("../../controllers/authentication/registerUserController");
const authRouter = (0, express_1.Router)();
authRouter.post("/register", registerUserController_1.createUser);
exports.default = authRouter;
