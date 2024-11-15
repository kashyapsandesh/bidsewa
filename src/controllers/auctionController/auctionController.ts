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
      console.log(files.images);
      for (const file of files) {
        const newFileName = `s3_auctionImage${Date.now().toString()}.${
          file.mimetype.split("/")[1]
        }`;
        const uploadResult = await uploadToS3(
          `upload/auctionImage/${newFileName}`,
          file,
          "bidsewa"
        );
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
        const newFileName = `s3_auctionImage${Date.now().toString()}.${
          file.mimetype.split("/")[1]
        }`;
        const uploadResult = await uploadToS3(
          `upload/auctionVideo/${newFileName}`,
          file,
          "bidsewa"
        );
        if (uploadResult) {
          videoUrls.push(uploadResult); // Ensure uploadResult is the correct URL
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
      return new AppError(
        "Bid start time should be less than bid end time",
        400
      );
    }
    if (new Date(bidEndTime) <= new Date(bidstartTime)) {
      return new AppError(
        "Bid end time should be greater than bid start time",
        400
      );
    }
    const sellerplan = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        plan: true,
      },
    });
    console.log(sellerplan?.plan);
    if (sellerplan?.plan == "CommissionBased") {
      const checkDueCommission = await prisma.commissionCharge.findFirst({
        where: {
          userId: req.user.id,
        },
      });
      console.log(checkDueCommission?.sellCount);
      console.log(checkDueCommission?.amount);
      if (checkDueCommission?.sellCount == 3 && checkDueCommission.amount > 0) {
        throw new AppError(
          "You have to pay due commission to create new auction",
          400
        );
      }
    }

    if (sellerplan?.plan == "SubscriptionPlan") {
      const checkSubscriptionPlan = await prisma.subscription.findFirst({
        where: {
          userId: req.user.id,
        },
      });
      if (
        checkSubscriptionPlan?.plan == "FREE" &&
        checkSubscriptionPlan?.sellCount == 3
      ) {
        throw new AppError(
          "You need to upgrade your subscription plan to create new auction",
          400
        );
      }
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
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAllAuctions: RequestHandler = async (req, res) => {
  try {
    // Get page and limit from query parameters, with default values
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Calculate the number of records to skip
    const skip = (page - 1) * limit;

    // Get total count of auctions
    const totalAuctions = await prisma.bidProduct.count();

    // Fetch auctions with pagination
    const auctions = await prisma.bidProduct.findMany({
      skip,
      take: limit,
      include: {
        images: true, // Include related images
        videos: true,
      },
    });

    // Map through the auctions to format the response and generate presigned URLs for images and videos
    const formattedAuctions = await Promise.all(
      auctions.map(async (auction) => {
        const presignedImageUrls = await Promise.all(
          auction.images.map((image) =>
            generatePresignedUrl(image.url, "bidsewa")
          )
        );

        const presignedVideoUrls = await Promise.all(
          auction.videos.map((video) =>
            generatePresignedUrl(video.url, "bidsewa")
          )
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
          images: presignedImageUrls,
          videos: presignedVideoUrls,
        };
      })
    );

    // Calculate total pages
    const totalPages = Math.ceil(totalAuctions / limit);

    return res.status(200).json({
      message: "Auctions retrieved successfully",
      currentPage: page,
      totalPages,
      totalAuctions,
      auctions: formattedAuctions,
    });
  } catch (error: any) {
    console.error("Error fetching auctions:", error);
    return res.status(500).json({ message: error.message });
  }
};
