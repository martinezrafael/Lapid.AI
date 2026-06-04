-- CreateTable
CREATE TABLE "refined_notes" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "suggested_filename" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refined_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_cvs" (
    "id" TEXT NOT NULL,
    "full_content" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_cvs_pkey" PRIMARY KEY ("id")
);
