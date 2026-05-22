-- CreateTable
CREATE TABLE "Contact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "source" TEXT,
    "context" TEXT,
    "lastInteractionDate" TEXT,
    "lastInteractionSummary" TEXT,
    "tags" TEXT,
    "notes" TEXT
);
