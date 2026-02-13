-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Joven',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Member" ("createdAt", "id", "name", "phone") SELECT "createdAt", "id", "name", "phone" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
