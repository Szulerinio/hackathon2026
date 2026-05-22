/*
  Warnings:

  - You are about to drop the column `householdMembers` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `isHousehold` on the `Contact` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contactId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "note" TEXT,
    "role" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contactId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActivityEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "relationship" TEXT,
    "source" TEXT,
    "context" TEXT,
    "lastInteractionDate" TEXT,
    "lastInteractionSummary" TEXT,
    "notes" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "contactType" TEXT,
    "participantRole" TEXT,
    "decayThresholdDays" INTEGER NOT NULL DEFAULT 180,
    "phone" TEXT,
    "email" TEXT,
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
INSERT INTO "new_Contact" ("city", "contactType", "context", "createdAt", "decayThresholdDays", "email", "id", "lastChannel", "lastInteractionDate", "lastInteractionSummary", "lifeEventDate", "lifeEventLabel", "name", "notes", "participantRole", "phone", "referredById", "relationship", "sentiment", "slug", "source", "tags", "updatedAt") SELECT "city", "contactType", "context", "createdAt", "decayThresholdDays", "email", "id", "lastChannel", "lastInteractionDate", "lastInteractionSummary", "lifeEventDate", "lifeEventLabel", "name", "notes", "participantRole", "phone", "referredById", "relationship", "sentiment", "slug", "source", "tags", "updatedAt" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE UNIQUE INDEX "Contact_slug_key" ON "Contact"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
