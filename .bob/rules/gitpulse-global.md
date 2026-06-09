# GitPulse Global Rules

These rules apply to ALL GitPulse skills and modes.

## File Reading Requirements

- **Always read ALL referenced files fully before producing any output**
- Never fabricate code snippets or line numbers — only quote what is actually in the file
- If you need context from multiple files, read them all before making conclusions

## Output Format Rules

- **When outputting JSON, output ONLY valid JSON** — no preamble, no markdown fences, no explanation
- **When outputting Markdown, output ONLY markdown** — no JSON, no preamble
- Never mix formats — choose one and stick to it for the entire response

## Accuracy Requirements

- If a file is empty or has no relevant issues, return an empty array `[]` for JSON skills
- Always include a `line` field — if exact line is unclear, give the best approximation
- Never report theoretical or hypothetical issues — only real, confirmed problems
- Base all documentation on actual code content, not assumptions or generic templates

## Evidence Standards

- Every issue must include specific evidence from the actual code
- Quote exact code snippets when identifying problems
- Provide precise line numbers or line ranges
- If you cannot find concrete evidence, do not report the issue