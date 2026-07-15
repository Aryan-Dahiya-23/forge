export const AI_ACTIONS = ["rewrite", "expand", "simplify"] as const;

export type AiAction = (typeof AI_ACTIONS)[number];

export type AiRewriteRequest = {
  text: string;
  action: AiAction;
};

export function isAiAction(value: unknown): value is AiAction {
  return (
    typeof value === "string" &&
    (AI_ACTIONS as readonly string[]).includes(value)
  );
}
