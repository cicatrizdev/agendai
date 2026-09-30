import type { Rule } from "eslint";

const SERVICE_KEY_NAME = "SUPABASE_SERVICE_ROLE_KEY";

/**
 * Forbids reading the product's Supabase service role key.
 * The service key bypasses RLS, so only one-off scripts under `scripts/` may use it.
 */
export const noServiceKeyOutsideScripts: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow the Supabase service role key outside scripts/",
    },
    messages: {
      forbidden: "Service key usage is not allowed here.",
    },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (node.value === SERVICE_KEY_NAME) {
          context.report({ node, messageId: "forbidden" });
        }
      },
      MemberExpression(node) {
        if (!node.computed && node.property.type === "Identifier" && node.property.name === SERVICE_KEY_NAME) {
          context.report({ node, messageId: "forbidden" });
        }
      },
    };
  },
};
