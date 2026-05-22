/*
  Warnings:

  - Added the required column `slug` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Contact` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Listing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "address" TEXT,
    "ownerId" INTEGER NOT NULL,
    "valueDisplay" TEXT,
    "valuePln" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "listingId" INTEGER NOT NULL,
    "buyerId" INTEGER,
    "status" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "valueDisplay" TEXT,
    "valuePln" DECIMAL,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deal_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Deal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contactId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "suggestedAction" TEXT,
    "severity" TEXT NOT NULL,
    "daysSince" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "source" TEXT,
    "context" TEXT,
    "lastInteractionDate" TEXT,
    "lastInteractionSummary" TEXT,
    "notes" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "contactType" TEXT,
    "decayThresholdDays" INTEGER NOT NULL DEFAULT 180,
    "isHousehold" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "email" TEXT,
    "householdMembers" TEXT,
    "city" TEXT,
    "referredById" INTEGER,
    "lifeEventDate" TEXT,
    "lifeEventLabel" TEXT,
    "sentiment" TEXT,
    "lastChannel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contact_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("context", "id", "lastInteractionDate", "lastInteractionSummary", "name", "notes", "relationship", "source", "tags") SELECT "context", "id", "lastInteractionDate", "lastInteractionSummary", "name", "notes", "relationship", "source", coalesce("tags", '[]') AS "tags" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE UNIQUE INDEX "Contact_slug_key" ON "Contact"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
