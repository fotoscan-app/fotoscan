-- Additive changes for the auth + gallery-link release. Safe to run more than once.
-- Apply with raw SQL, NOT `prisma db push`: the live DB also has GuestSession download
-- columns from the unmerged feat/admin-face-scan-download-metrics branch, and db push
-- from this schema would drop them.

-- Share full gallery link
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "galleryToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Event_galleryToken_key" ON "Event"("galleryToken");

-- Sign-up email verification codes
CREATE TABLE IF NOT EXISTS "SignupOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignupOtp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SignupOtp_email_idx" ON "SignupOtp"("email");

-- Wrong-attempt limit on password reset codes
ALTER TABLE "PasswordReset" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
