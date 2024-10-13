/*
  Warnings:

  - You are about to alter the column `esewaId` on the `UserPaymentMethod` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `khaltiId` on the `UserPaymentMethod` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `plan` ENUM('SubscriptionPlan', 'CommissionBased') NULL;

-- AlterTable
ALTER TABLE `UserPaymentMethod` MODIFY `esewaId` INTEGER NULL,
    MODIFY `khaltiId` INTEGER NULL;

-- CreateTable
CREATE TABLE `CommissionCharge` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `sellCount` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CommissionCharge` ADD CONSTRAINT `CommissionCharge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPaymentMethod` ADD CONSTRAINT `UserPaymentMethod_esewaId_fkey` FOREIGN KEY (`esewaId`) REFERENCES `EsewaDetails`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPaymentMethod` ADD CONSTRAINT `UserPaymentMethod_khaltiId_fkey` FOREIGN KEY (`khaltiId`) REFERENCES `KhaltiDetails`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
