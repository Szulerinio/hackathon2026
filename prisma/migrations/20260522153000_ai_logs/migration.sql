-- CreateTable
CREATE TABLE "logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "contactSlug" TEXT,
    "model" TEXT,
    "summary" TEXT,
    "inputPreview" TEXT,
    "payload" TEXT,
    "error" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
