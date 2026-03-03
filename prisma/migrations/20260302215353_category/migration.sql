/*
  Warnings:

  - You are about to drop the column `category` on the `Products` table. All the data in the column will be lost.
  - You are about to drop the `_MuscleToProducts` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,category]` on the table `Muscle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Muscle` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_MuscleToProducts" DROP CONSTRAINT "_MuscleToProducts_A_fkey";

-- DropForeignKey
ALTER TABLE "_MuscleToProducts" DROP CONSTRAINT "_MuscleToProducts_B_fkey";

-- AlterTable
ALTER TABLE "Muscle" ADD COLUMN     "category" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Products" DROP COLUMN "category";

-- DropTable
DROP TABLE "_MuscleToProducts";

-- CreateTable
CREATE TABLE "ProductMuscle" (
    "productId" TEXT NOT NULL,
    "muscleId" TEXT NOT NULL,

    CONSTRAINT "ProductMuscle_pkey" PRIMARY KEY ("productId","muscleId")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "_CategoryToProducts_B_index" ON "_CategoryToProducts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Muscle_name_category_key" ON "Muscle"("name", "category");

-- AddForeignKey
ALTER TABLE "ProductMuscle" ADD CONSTRAINT "ProductMuscle_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMuscle" ADD CONSTRAINT "ProductMuscle_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProducts" ADD CONSTRAINT "_CategoryToProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProducts" ADD CONSTRAINT "_CategoryToProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
