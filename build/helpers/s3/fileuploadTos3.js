"use strict";
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
exports.generatePresignedUrl = exports.deleteFromS3 = exports.uploadToS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const url_parser_1 = require("@smithy/url-parser");
const appError_1 = require("../../utils/appError");
const util_format_url_1 = require("@aws-sdk/util-format-url");
const hash_node_1 = require("@smithy/hash-node");
const protocol_http_1 = require("@smithy/protocol-http");
const uploadToS3 = (file, bucketname) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(process.env.AwsAccessKey);
        console.log(process.env.AwsSecrateKey);
        console.log("called");
        const client = new client_s3_1.S3Client({
            region: process.env.AwsRegion,
            credentials: {
                accessKeyId: process.env.AwsAccessKey,
                secretAccessKey: process.env.AwsSecrateKey,
            },
        });
        const newFileName = `s3_${Date.now().toString()}.${file.mimetype.split("/")[1]}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucketname,
            Key: newFileName,
            Body: file.data, // Using file.buffer for file data
            ContentType: file.mimetype,
        });
        yield client.send(command); // Wait for the upload to complete
        // Construct the S3 URL
        const fileUrl = `https://${bucketname}.s3.ap-south-1.amazonaws.com/${newFileName}`;
        return newFileName; // Return the URL as a string
    }
    catch (e) {
        console.error("S3 upload error:", e); // Log error for debugging
        throw new Error(e.message); // Throw error to be handled by the controller
    }
});
exports.uploadToS3 = uploadToS3;
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
const deleteFromS3 = (filename, bucketname) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(process.env.AwsAccessKey);
        console.log(process.env.AwsSecrateKey);
        console.log("called");
        const client = new client_s3_1.S3Client({
            region: process.env.AwsRegion,
            credentials: {
                accessKeyId: process.env.AwsAccessKey,
                secretAccessKey: process.env.AwsSecrateKey,
            },
        });
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: bucketname,
            Key: filename,
        });
        const result = yield client.send(command);
        return result; // Returning the result to the controller
    }
    catch (e) {
        console.error("S3 upload error:", e); // Log error for debugging
        throw new Error(e.message); // Throw error to be handled by the controller
    }
});
exports.deleteFromS3 = deleteFromS3;
const generatePresignedUrl = (filename, bucketName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = (0, url_parser_1.parseUrl)(`https://${bucketName}.s3.ap-south-1.amazonaws.com/${filename}`);
        const s3Presigner = new s3_request_presigner_1.S3RequestPresigner({
            region: process.env.AwsRegion,
            credentials: {
                accessKeyId: process.env.AwsAccessKey,
                secretAccessKey: process.env.AwsSecrateKey,
            },
            sha256: hash_node_1.Hash.bind(null, "sha256"),
        });
        const presignedUrlObject = yield s3Presigner.presign(new protocol_http_1.HttpRequest(Object.assign(Object.assign({}, url), { method: "GET" })));
        return (0, util_format_url_1.formatUrl)(presignedUrlObject);
    }
    catch (error) {
        throw new appError_1.AppError(error.message, 500);
    }
});
exports.generatePresignedUrl = generatePresignedUrl;
