import { Router } from "express";
import {
  createNewAuction,
  getAllAuctions,
} from "../../controllers/auctionController/auctionController";
import { isAuthenticated } from "../../middlewares/auth/authMiddleware";
const auctionRouter = Router();
auctionRouter.post("/createnewauction", isAuthenticated, createNewAuction);
auctionRouter.get("/getallauction", getAllAuctions);
// auctionRouter.delete("/delete/:filename", deleteUploads);
// auctionRouter.get("/view/:filename", viewUploads);

export default auctionRouter;
