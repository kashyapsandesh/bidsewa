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

//     if (req.files && req.files.profilepic && req.files.profilepic.name) {
//       console.log("cameee here");
//       const result = await uploadToS3(req.files.profilepic, "bidsewa");
//       console.log(result);
//       return res.status(200).json({
//         message: "Auction created successfully",
//         data: result,
//       });
//     } else {
//       return res.status(400).json({ message: "Profile picture is required" });
//     }
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// export const viewUploads: RequestHandler = async (
//   req: any,
//   res: Response<any>
// ) => {
//   try {
//     if (req.params.filename) {
//       const result = await generatePresignedUrl(req.params.filename, "bidsewa");
//       return res.status(200).json({
//         message: "Viewing the file",
//         data: result,
//       });
//     }
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message });
//   }
// };
// export const deleteUploads: RequestHandler = async (
//   req: any,
//   res: Response<any>
// ) => {
//   try {
//     if (req.params.filename) {
//       console.log("cameee here");
//       const result = await deleteFromS3(req.params.filename, "bidsewa");
//       console.log(result);
//       return res.status(200).json({
//         message: "Auction created successfully",
//         data: result,
//       });
//     } else {
//       return res.status(400).json({ message: "Profile picture is required" });
//     }
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message });
//   }
// };

import { Request, RequestHandler, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  generatePresignedUrl,
  uploadToS3,
} from "../../helpers/s3/fileuploadTos3";
import { AppError } from "../../utils/appError";

const prisma = new PrismaClient();

export const createNewAuction: RequestHandler = async (
  req: any,
  res: Response<any>
) => {
  try {
    const {
      name,
      description,
      startingBidAmount,
      currentBidAmount,
      highestBidAmount,
      bidstartTime,
      bidEndTime,
      categoryId,
    } = req.body;

    if (
      !name ||
      !description ||
      !startingBidAmount ||
      !bidstartTime ||
      !bidEndTime
    ) {
      throw new AppError("Missing required fields", 400);
    }

    // Image and Video upload logic
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];

    // Handling image uploads
    if (req.files && req.files.images) {
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
      for (const file of files) {
        const uploadResult = await uploadToS3(file, "bidsewa");
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
        const uploadResult = await uploadToS3(file, "bidsewa");
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

    // Create auction with images and videos
    // Create auction with images and videos
    const auction = await prisma.bidProduct.create({
      data: {
        name,
        description,
        startingBidAmount: parseFloat(startingBidAmount),
        currentBidAmount: parseFloat(currentBidAmount || startingBidAmount),
        highestBidAmount: parseFloat(highestBidAmount || startingBidAmount),
        bidstartTime: new Date(bidstartTime),
        bidEndTime: new Date(bidEndTime),
        seller: {
          connect: { id: req.user.id }, // Assuming user ID comes from an authenticated session
        },
        ...(categoryId && {
          category: {
            connect: { id: parseInt(categoryId) }, // Use categoryId from request body
          },
        }),
        images: {
          create: imageUrls.map((url) => ({ url })),
        },
        videos: {
          create: videoUrls.map((url) => ({ url })),
        },
      },
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
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAllAuctions: RequestHandler = async (req, res) => {
  try {
    const auctions = await prisma.bidProduct.findMany({
      include: {
        images: true, // Include related images
      },
    });

    // Map through the auctions to format the response and generate presigned URLs for images
    const formattedAuctions = await Promise.all(
      auctions.map(async (auction) => {
        const presignedImageUrls = await Promise.all(
          auction.images.map((image) =>
            generatePresignedUrl(image.url, "bidsewa")
          ) // Adjust bucket name as needed
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
      })
    );

    return res.status(200).json({
      message: "Auctions retrieved successfully",
      auctions: formattedAuctions,
    });
  } catch (error: any) {
    console.error("Error fetching auctions:", error);
    return res.status(500).json({ message: error.message });
  }
};
