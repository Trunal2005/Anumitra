import "dotenv/config";
if (
  process.env.ANUMITRA_TEST_TARGET !== "disposable" ||
  !/^\/anumitra_test_[a-z0-9_]+$/.test(
    new URL(process.env.DATABASE_URL ?? "http://invalid").pathname,
  ) ||
  !process.env.LOCAL_STATE_PATH ||
  !process.env.STORAGE_PATH
)
  throw new Error(
    "Use npm run verify:isolated. Tests refuse the normal demo database, storage and credentials.",
  );
