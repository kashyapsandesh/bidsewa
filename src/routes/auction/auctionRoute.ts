import { Router } from "express";
import { createNewAuction } from "../../controllers/auctionController/auctionController";
import { isAuthenticated } from "../../middlewares/auth/authMiddleware";
const auctionRouter = Router();
auctionRouter.post("/createnewauction", isAuthenticated, createNewAuction);
// auctionRouter.delete("/delete/:filename", deleteUploads);
// auctionRouter.get("/view/:filename", viewUploads);

export default auctionRouter;
