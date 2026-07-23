-- Verification tokens never expired, despite the email promising 24 hours.
ALTER TABLE "User" ADD COLUMN "emailVerificationExpires" TIMESTAMP(3);

-- Grandfather existing accounts. Email verification was set but never checked,
-- so every account created before enforcement has emailVerified = false through
-- no fault of its own. Without this backfill, turning the check on would lock
-- out every existing user.
UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false;
