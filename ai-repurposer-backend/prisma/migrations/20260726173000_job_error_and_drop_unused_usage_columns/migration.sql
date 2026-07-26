-- Why a FAILED job failed, in words the submitter can act on. Populated only
-- from the mapped constants in src/modules/jobs/job-error.ts.
-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "error" TEXT;

-- Nothing ever read or wrote these: Redis is the sole quota store, so both
-- columns held their defaults on every row while looking authoritative.
-- Verified empty of meaningful data before dropping.
-- AlterTable
ALTER TABLE "User" DROP COLUMN "jobsUsedThisMonth",
DROP COLUMN "usagePeriodStart";
