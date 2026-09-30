import type { ESLint } from "eslint";
import { noServiceKeyOutsideScripts } from "./no-service-key-outside-scripts.ts";

/** ESLint plugin with the Agendaí custom rules. */
export const agendaiPlugin: ESLint.Plugin = {
  meta: { name: "agendai" },
  rules: {
    "no-service-key-outside-scripts": noServiceKeyOutsideScripts,
  },
};
