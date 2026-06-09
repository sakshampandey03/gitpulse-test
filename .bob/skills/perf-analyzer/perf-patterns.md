# Performance Anti-Patterns

## Algorithmic Complexity
- **O(n²) nested loops**: looping over an array inside a loop over the same (or similar-size) array — fix with Map/Set lookups
- **Repeated `.find()` / `.filter()` inside a loop**: O(n) scan inside O(n) loop = O(n²)
- **Sorting inside a loop**: O(n log n) per iteration — sort once outside
- **Recursive functions without memoisation**: exponential growth on overlapping subproblems

## Memory Leaks
- **Event listeners added but never removed**: `addEventListener` inside a function called repeatedly, no corresponding `removeEventListener`
- **Closures capturing large objects**: a callback that holds a reference to a large array/object, preventing GC
- **`setInterval` / `setTimeout` never cleared**: timers accumulate, callbacks run forever
- **Growing caches without eviction**: objects added to a Map/object cache but never removed
- **Streams or file handles not closed on error paths**: leak only in the exception path, hard to spot

## Blocking Operations
- **Synchronous file I/O on hot path**: `fs.readFileSync` / `fs.writeFileSync` in request handlers
- **`JSON.parse` / `JSON.stringify` on very large objects** in a tight loop
- **CPU-intensive work on the main thread** (Node.js): cryptography, image processing, parsing — should be in a worker thread
- **Database queries inside a loop**: N+1 query problem — fetch related data in one batch query instead

## Unnecessary Work
- **Recomputing derived values on every access**: compute once, cache the result
- **Deep cloning objects unnecessarily**: `JSON.parse(JSON.stringify(obj))` is expensive — use structural sharing or targeted copy
- **Fetching full records when only one field is needed**: `SELECT *` when only `id` is used
- **Re-rendering caused by reference inequality**: creating new objects/arrays in render functions causing downstream re-renders (React)

## Inefficient Data Structures
- **Using Array for membership checks**: `array.includes(x)` is O(n) — use a `Set` for O(1)
- **Using Array for key-value lookup**: `array.find(x => x.id === id)` is O(n) — use a `Map` for O(1)
- **String concatenation in a loop**: `str += chunk` creates a new string each iteration — use array `.join()`

## Network / I/O
- **Sequential awaits that could be parallel**: `await a(); await b()` when a and b are independent — use `Promise.all([a(), b()])`
- **No pagination on large result sets**: fetching all records when only the first page is shown
- **Missing response caching for expensive, rarely-changing data**
