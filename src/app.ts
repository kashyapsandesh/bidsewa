import express, { Express, Request, Response } from "express";
import authRouter from "./routes/authentication/authRoute";
import errorHandler from "./middlewares/errorHandler";
const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user", authRouter);
app.use(errorHandler);
export default app;
