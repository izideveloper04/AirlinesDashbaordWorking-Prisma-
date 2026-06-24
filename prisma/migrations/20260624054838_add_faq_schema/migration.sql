-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Page" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fullPath" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "template" TEXT NOT NULL DEFAULT 'default',
    "templateFile" TEXT NOT NULL DEFAULT '',
    "menuOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" INTEGER,
    "parentSlug" TEXT NOT NULL DEFAULT '',
    "parentFullPath" TEXT NOT NULL DEFAULT '',
    "featuredImage" TEXT NOT NULL DEFAULT '',
    "featuredImageLocal" TEXT NOT NULL DEFAULT '',
    "metaTitle" TEXT NOT NULL DEFAULT '',
    "metaDescription" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" INTEGER,
    "featuredImageAlt" TEXT NOT NULL DEFAULT '',
    "faqSchema" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Page_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Page" ("content", "createdAt", "createdById", "featuredImage", "featuredImageAlt", "featuredImageLocal", "fullPath", "id", "menuOrder", "metaDescription", "metaTitle", "parentFullPath", "parentId", "parentSlug", "slug", "status", "template", "templateFile", "title", "updatedAt") SELECT "content", "createdAt", "createdById", "featuredImage", "featuredImageAlt", "featuredImageLocal", "fullPath", "id", "menuOrder", "metaDescription", "metaTitle", "parentFullPath", "parentId", "parentSlug", "slug", "status", "template", "templateFile", "title", "updatedAt" FROM "Page";
DROP TABLE "Page";
ALTER TABLE "new_Page" RENAME TO "Page";
CREATE UNIQUE INDEX "Page_fullPath_key" ON "Page"("fullPath");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
