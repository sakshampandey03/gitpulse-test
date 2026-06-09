---
name: architecture-diagram
description: Generate a Mermaid architecture diagram showing the system's modules, their responsibilities, and how they depend on each other
---

You are a software architect. Generate diagrams that show the big picture — how the system is structured and how data flows through it.

<Steps>

<Step>
Explore the project structure before diagramming. Read:
- The top-level directory tree
- `package.json` / `pom.xml` — for the project type and main dependencies
- Entry point file — to understand the bootstrap/wiring
- Key module files (controllers, services, repositories, models if present) — to understand what each layer does
- Any existing architecture docs

Build a mental map: what are the main components and what does each one do?
</Step>

<Step>
Identify the architectural layers and components:
- **External actors**: browser client, mobile app, external APIs, databases, message queues
- **Entry points**: HTTP server, CLI, event listener
- **Core layers**: controllers/routes → services/business logic → repositories/data access
- **Shared utilities**: auth middleware, logging, config, error handling
- **External dependencies**: third-party APIs the app calls (payment, email, maps, etc.)

Note which components call which others — this becomes the arrows.
</Step>

<Step>
Write a Mermaid `graph TD` diagram. Rules:
- Group related components using `subgraph` blocks with clear labels
- Use directional arrows `-->` to show data/call flow
- Label arrows when the relationship type is not obvious (e.g. `-->|reads from|`, `-->|emits|`)
- Keep component names short (under 25 chars)
- External systems go in their own subgraph at the boundary

Example structure:
```
graph TD
    subgraph Client
        Browser
        MobileApp
    end

    subgraph API["API Layer"]
        Router --> AuthMiddleware
        AuthMiddleware --> UserController
        AuthMiddleware --> OrderController
    end

    subgraph Services["Business Logic"]
        UserController --> UserService
        OrderController --> OrderService
        OrderService --> PaymentService
    end

    subgraph Data["Data Layer"]
        UserService --> UserRepo
        OrderService --> OrderRepo
        UserRepo --> DB[(PostgreSQL)]
        OrderRepo --> DB
    end

    subgraph External
        PaymentService -->|HTTPS| Stripe
        UserService -->|SMTP| SendGrid
    end

    Browser --> Router
    MobileApp --> Router
```
</Step>

<Step>
Also write a brief `ARCHITECTURE.md` file (max 300 words) explaining:
- What the system does in one paragraph
- The main architectural pattern used (MVC, layered, event-driven, microservices, etc.)
- One sentence per major component explaining its role
- Any notable design decisions

Write both files:
- `docs/architecture.md` — contains the Mermaid diagram
- `ARCHITECTURE.md` — contains the prose explanation
</Step>

</Steps>
