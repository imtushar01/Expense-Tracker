-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" DECIMAL NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
