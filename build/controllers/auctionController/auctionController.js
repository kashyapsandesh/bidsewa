"use strict";
// import { Request, RequestHandler, Response } from "express";
// import { AppError } from "../../utils/appError";
// import {
//   deleteFromS3,
//   generatePresignedUrl,
//   uploadToS3,
// } from "../../helpers/s3/fileuploadTos3";
// export const createNewAuction: RequestHandler = async (
//   req: any,
//   res: Response<any>
// ) => {
//   try {
//     const {
//       name,
//       description,
//       startingBidAmount,
//       currentBidAmount,
//       highestBidAmount,
//       bidstartTime,
//       bidEndTime,
//     } = req.body;
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAuctions = exports.createNewAuction = void 0;
const client_1 = require("@prisma/client");
const fileuploadTos3_1 = require("../../helpers/s3/fileuploadTos3");
const appError_1 = require("../../utils/appError");
const prisma = new client_1.PrismaClient();
const createNewAuction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, startingBidAmount, currentBidAmount, highestBidAmount, bidstartTime, bidEndTime, categoryId, } = req.body;
        if (!name ||
            !description ||
            !startingBidAmount ||
            !bidstartTime ||
            !bidEndTime) {
            throw new appError_1.AppError("Missing required fields", 400);
        }
        // Image and Video upload logic
        const imageUrls = [];
        const videoUrls = [];
        // Handling image uploads
        if (req.files && req.files.images) {
            const files = Array.isArray(req.files.images)
                ? req.files.images
                : [req.files.images];
            console.log(files.images);
            for (const file of files) {
                const uploadResult = yield (0, fileuploadTos3_1.uploadToS3)(file, "bidsewa");
                if (uploadResult) {
                    imageUrls.push(uploadResult); // This should now work correctly
                }
            }
        }
        // Handling video uploads
        if (req.files && req.files.videos) {
            const files = Array.isArray(req.files.videos)
                ? req.files.videos
                : [req.files.videos];
            for (const file of files) {
                const uploadResult = yield (0, fileuploadTos3_1.uploadToS3)(file, "bidsewa");
                if (uploadResult) {
                    imageUrls.push(uploadResult); // Ensure uploadResult is the correct URL
                }
            }
        }
        // Ensure at least one image is uploaded
        if (imageUrls.length === 0) {
            return res
                .status(400)
                .json({ message: "At least one image is required" });
        }
        if (new Date(bidstartTime) > new Date(bidEndTime)) {
            return new appError_1.AppError("Bid start time should be less than bid end time", 400);
        }
        if (new Date(bidEndTime) <= new Date(bidstartTime)) {
            return new appError_1.AppError("Bid end time should be greater than bid start time", 400);
        }
        // Create auction with images and videos
        // Create auction with images and videos
        const auction = yield prisma.bidProduct.create({
            data: Object.assign(Object.assign({ name,
                description, startingBidAmount: parseFloat(startingBidAmount), currentBidAmount: parseFloat(currentBidAmount || startingBidAmount), highestBidAmount: parseFloat(highestBidAmount || startingBidAmount), bidstartTime: new Date(bidstartTime), bidEndTime: new Date(bidEndTime), seller: {
                    connect: { id: req.user.id }, // Assuming user ID comes from an authenticated session
                } }, (categoryId && {
                category: {
                    connect: { id: parseInt(categoryId) }, // Use categoryId from request body
                },
            })), { images: {
                    create: imageUrls.map((url) => ({ url })),
                }, videos: {
                    create: videoUrls.map((url) => ({ url })),
                } }),
            include: {
                images: true, // Include images in the response
                videos: true, // Include videos in the response
            },
        });
        // Return the auction response including images and videos
        return res.status(201).json({
            message: "Auction created successfully",
            auction,
        });
        return res.status(201).json({
            message: "Auction created successfully",
            auction,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});
exports.createNewAuction = createNewAuction;
const getAllAuctions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const auctions = yield prisma.bidProduct.findMany({
            include: {
                images: true, // Include related images
            },
        });
        // Map through the auctions to format the response and generate presigned URLs for images
        const formattedAuctions = yield Promise.all(auctions.map((auction) => __awaiter(void 0, void 0, void 0, function* () {
            const presignedImageUrls = yield Promise.all(auction.images.map((image) => (0, fileuploadTos3_1.generatePresignedUrl)(image.url, "bidsewa")) // Adjust bucket name as needed
            );
            return {
                id: auction.id,
                userId: auction.userId,
                name: auction.name,
                description: auction.description,
                startingBidAmount: auction.startingBidAmount,
                currentBidAmount: auction.currentBidAmount,
                highestBidAmount: auction.highestBidAmount,
                bidstartTime: auction.bidstartTime,
                bidEndTime: auction.bidEndTime,
                createdAt: auction.createdAt,
                updatedAt: auction.updatedAt,
                images: presignedImageUrls, // Use presigned URLs instead of direct URLs
            };
        })));
        return res.status(200).json({
            message: "Auctions retrieved successfully",
            auctions: formattedAuctions,
        });
    }
    catch (error) {
        console.error("Error fetching auctions:", error);
        return res.status(500).json({ message: error.message });
    }
});
exports.getAllAuctions = getAllAuctions;
