import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@smithy/url-parser";
import { AppError } from "../../utils/appError";
import { formatUrl } from "@aws-sdk/util-format-url";
import { Hash } from "@smithy/hash-node";
import { HttpRequest } from "@smithy/protocol-http";
export const uploadToS3 = async (key:any, file: any, bucketname: string) => {
  try {
    console.log(process.env.AwsAccessKey);
    console.log(process.env.AwsSecrateKey);
    console.log("called");

    const client = new S3Client({
      region: process.env.AwsRegion as string,
      credentials: {
        accessKeyId: process.env.AwsAccessKey as string,
        secretAccessKey: process.env.AwsSecrateKey as string,
      },
    });

    const newFileName = `s3_${Date.now().toString()}.${
      file.mimetype.split("/")[1]
    }`;
    const command = new PutObjectCommand({
      Bucket: bucketname,
      Key: key,
      Body: file.data, // Using file.buffer for file data
      ContentType: file.mimetype,
    });

    await client.send(command); // Wait for the upload to complete

    // Construct the S3 URL
    const fileUrl = `https://${bucketname}.s3.ap-south-1.amazonaws.com/${newFileName}`;
    return newFileName; // Return the URL as a string
  } catch (e: any) {
    console.error("S3 upload error:", e); // Log error for debugging
    throw new Error(e.message); // Throw error to be handled by the controller
  }
};
// export const uploadToS3 = async (file: any, bucketname: string) => {
//   try {
//     console.log(process.env.AwsAccessKey as string);
//     console.log(process.env.AwsSecrateKey as string);
//     console.log("called");

//     const client = new S3Client({
//       region: process.env.AwsRegion as string,
//       credentials: {
//         accessKeyId: process.env.AwsAccessKey as string,
//         secretAccessKey: process.env.AwsSecrateKey as string,
//       },
//     });

//     const newFileName = `s3_${Date.now().toString()}-${file.originalname}.${
//       file.mimetype.split("/")[1]
//     }`;
//     const command = new PutObjectCommand({
//       Bucket: bucketname,
//       Key: newFileName,
//       Body: file.buffer, // Using file.buffer for file data
//       ContentType: file.mimetype,
//     });

//     const result = await client.send(command);
//     return result; // Returning the result to the controller
//   } catch (e: any) {
//     console.error("S3 upload error:", e); // Log error for debugging
//     throw new Error(e.message); // Throw error to be handled by the controller
//   }
// };
export const deleteFromS3 = async (filename: string, bucketname: string) => {
  try {
    console.log(process.env.AwsAccessKey as string);
    console.log(process.env.AwsSecrateKey as string);
    console.log("called");

    const client = new S3Client({
      region: process.env.AwsRegion as string,
      credentials: {
        accessKeyId: process.env.AwsAccessKey as string,
        secretAccessKey: process.env.AwsSecrateKey as string,
      },
    });

    const command = new DeleteObjectCommand({
      Bucket: bucketname,
      Key: filename,
    });

    const result = await client.send(command);
    return result; // Returning the result to the controller
  } catch (e: any) {
    console.error("S3 upload error:", e); // Log error for debugging
    throw new Error(e.message); // Throw error to be handled by the controller
  }
};

export const generatePresignedUrl = async (
  filename: string,
  bucketName: string
) => {
  try {
    const url = parseUrl(
      `https://${bucketName}.s3.ap-south-1.amazonaws.com/${filename}`
    );
    const s3Presigner = new S3RequestPresigner({
      region: process.env.AwsRegion as string,
      credentials: {
        accessKeyId: process.env.AwsAccessKey as string,
        secretAccessKey: process.env.AwsSecrateKey as string,
      },
      sha256: Hash.bind(null, "sha256"),
    });
    const presignedUrlObject = await s3Presigner.presign(
      new HttpRequest({
        ...url,
        method: "GET",
      })
    );
    return formatUrl(presignedUrlObject);
  } catch (error: any) {
    throw new AppError(error.message, 500);
  }
};
