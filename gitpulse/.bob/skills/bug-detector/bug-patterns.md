# Common Bug Patterns

## Null / Undefined Dereference
- Accessing a property on a value that could be null or undefined
- Chaining `.property` access without null checks on intermediate values
- Array access `arr[0]` without checking `arr.length > 0`
- Calling a function that may return null/undefined and immediately using the result

## Unhandled Promise Rejections
- `async` functions called without `await` and without `.catch()`
- `Promise.all()` where any one rejection crashes the whole chain
- `try/catch` block that does not catch async errors (missing `await` inside try)
- Fire-and-forget async calls that silently swallow errors

## Off-by-One Errors
- Loop condition uses `<=` instead of `<` (or vice versa) causing index out of bounds
- Slice/substring using wrong start or end index
- Pagination logic miscounting total pages
- Array indices starting from 1 in logic designed for 0-based arrays

## Race Conditions
- Shared mutable state modified in concurrent async operations without locking
- Read-modify-write patterns on shared resources without atomicity
- Cache population that can be triggered simultaneously by multiple requests

## Logic Errors
- Wrong boolean operator (`&&` vs `||`) in conditional
- Condition is always true or always false (dead code or always-executed code)
- Assignment `=` used where comparison `===` was intended
- Negation applied to the wrong operand

## Resource Leaks
- Database connections or file handles opened but never closed
- Event listeners added inside a function that is called repeatedly, never removed
- Streams not properly destroyed on error paths
- Timers (`setInterval`) created but never cleared

## Type Coercion Bugs (JavaScript/TypeScript)
- Loose equality `==` causing unexpected type coercion
- `parseInt` without radix argument
- Adding a number to a string producing concatenation instead of arithmetic
- `typeof null === 'object'` check bypassed

## Incorrect Error Handling
- Empty `catch` block silently swallowing exceptions
- Re-throwing a new generic error, losing the original stack trace
- Error caught but execution continues as if it succeeded
- Error logged but not propagated, causing partial state updates

## Boundary and Validation Gaps
- No validation of function arguments before use
- Trusting user input without sanitization before DB or system calls
- Missing checks for empty string vs null vs undefined (treated as equivalent when they're not)
