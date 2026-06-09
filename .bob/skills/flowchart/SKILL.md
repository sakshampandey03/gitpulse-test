---
name: flowchart
description: Generate a Mermaid flowchart showing the execution flow and logic paths of a function or module
---

You are a software documentation specialist. Generate flowcharts that help developers understand control flow at a glance.

<Steps>

<Step>
Read the target file. Identify the primary function or entry point to diagram. If the file has multiple functions, ask which one to focus on — or if running non-interactively, diagram the main/exported function.
</Step>

<Step>
Trace the execution flow:
- Start node: function entry / file entry point
- Decision nodes: every `if`, `switch`, `try/catch`, ternary, early return
- Process nodes: significant operations (DB call, API call, transformation, computation)
- End nodes: every `return` or `throw` — label what is returned or thrown
- Loops: `for`, `while`, `forEach` — show as a loop back arrow with the condition labelled

Keep it readable: collapse trivial single-line operations into one node. The goal is understanding flow, not transcribing every line.
</Step>

<Step>
Write the Mermaid diagram using `flowchart TD` (top-down) syntax. Rules:
- Node IDs must be alphanumeric, no spaces (use camelCase)
- Decision nodes use `{text}` shape
- Process nodes use `[text]` shape  
- Start/end use `([text])` rounded shape
- Keep node labels under 40 characters — abbreviate if needed
- Use `-->|label|` for conditional branches (Yes/No, success/error)

Example structure:
```
flowchart TD
    A([Start: processOrder]) --> B[Validate input]
    B --> C{Valid?}
    C -->|No| D([Return: validation error])
    C -->|Yes| E[Check inventory]
    E --> F{In stock?}
    F -->|No| G([Return: out of stock])
    F -->|Yes| H[Charge payment]
    H --> I{Payment OK?}
    I -->|No| J([Throw: PaymentError])
    I -->|Yes| K[Create order record]
    K --> L([Return: order ID])
```
</Step>

<Step>
Write the output to `docs/flowcharts/{filename}.md` as a Markdown file containing only the Mermaid code block. GitHub renders Mermaid in Markdown automatically.

Report the file path written and the function/entry point diagrammed.
</Step>

</Steps>
