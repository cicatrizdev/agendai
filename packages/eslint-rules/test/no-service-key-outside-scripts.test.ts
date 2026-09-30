import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import { noServiceKeyOutsideScripts } from "../src/no-service-key-outside-scripts.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({ languageOptions: { ecmaVersion: 2023, sourceType: "module" } });

tester.run("no-service-key-outside-scripts", noServiceKeyOutsideScripts, {
  valid: [
    "const url = process.env.SUPABASE_URL;",
    "const key = process.env.SUPABASE_ANON_KEY;",
  ],
  invalid: [
    {
      code: "const key = process.env.SUPABASE_SERVICE_ROLE_KEY;",
      errors: [{ messageId: "forbidden" }],
    },
    {
      code: 'const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];',
      errors: [{ messageId: "forbidden" }],
    },
  ],
});
