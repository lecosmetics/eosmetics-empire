-- AlterTable
ALTER TABLE "products" ADD COLUMN     "ingredients" TEXT,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "usageInstructions" TEXT,
ADD COLUMN     "weightContent" TEXT;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'XAF';
