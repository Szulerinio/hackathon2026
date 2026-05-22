-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActivityEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contactId" INTEGER NOT NULL,
    "dealId" INTEGER,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActivityEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ActivityEvent" ("contactId", "createdAt", "date", "id", "notes", "type", "updatedAt") SELECT "contactId", "createdAt", "date", "id", "notes", "type", "updatedAt" FROM "ActivityEvent";
DROP TABLE "ActivityEvent";
ALTER TABLE "new_ActivityEvent" RENAME TO "ActivityEvent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
