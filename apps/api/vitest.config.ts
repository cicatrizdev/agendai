import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // The API always runs in UTC in production; tests do the same so results don't depend on the machine.
    env: { TZ: "UTC" },
  },
});
