# SOLID Principles Reference

## S — Single Responsibility Principle
A class should have only one reason to change. It should do one thing and do it well.

**Violation signals:**
- Class name includes "Manager", "Handler", "Processor", "Util" and has 10+ unrelated methods
- Methods in the class belong to different business domains (e.g. auth + email + reporting in one class)
- The class touches the database AND formats output AND sends notifications

**Good pattern:** One class per concern. `UserAuthService`, `UserEmailService`, `UserReportService` — not `UserService` doing everything.

---

## O — Open/Closed Principle
Software entities should be open for extension but closed for modification.

**Violation signals:**
- Adding a new type/feature requires editing an existing `if/else` or `switch` chain
- A method like `processPayment(type)` with `if type === 'card' ... else if type === 'paypal'`
- Core logic changes every time a new variant is added

**Good pattern:** Strategy pattern, polymorphism, or plugin architecture so new behaviour is added by creating new classes, not editing old ones.

---

## L — Liskov Substitution Principle
Subtypes must be substitutable for their base types without breaking correctness.

**Violation signals:**
- Subclass overrides a method and throws an exception the parent never throws
- Subclass narrows the input type or widens the output type
- Subclass leaves inherited methods empty or with `throw new NotImplementedError()`
- Code does `if (obj instanceof SubClass)` to handle special cases

**Good pattern:** Subclass honours every contract the parent establishes. No surprises.

---

## I — Interface Segregation Principle
Clients should not be forced to depend on interfaces they do not use.

**Violation signals:**
- An interface or abstract class has 8+ methods and implementors leave half of them as `throw new Error('not implemented')`
- A class implements an interface but only uses 2 of its 10 required methods
- A "fat" base class that all subclasses must implement fully

**Good pattern:** Many small, focused interfaces rather than one large one. Classes implement only what they actually need.

---

## D — Dependency Inversion Principle
High-level modules should not depend on low-level modules. Both should depend on abstractions.

**Violation signals:**
- High-level service does `const db = new MySQLDatabase()` directly inside the class
- Hard-coded instantiation of concrete implementations inside business logic
- No dependency injection — dependencies created inside rather than passed in
- Unit testing is impossible without mocking global state

**Good pattern:** Pass dependencies via constructor. `class OrderService { constructor(db, emailer) {...} }`. Depend on an interface/abstraction, not a concrete class.
