-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);
