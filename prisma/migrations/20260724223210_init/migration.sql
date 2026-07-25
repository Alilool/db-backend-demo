-- CreateTable
CREATE TABLE "demo_tasks" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_tasks_pkey" PRIMARY KEY ("id")
);
