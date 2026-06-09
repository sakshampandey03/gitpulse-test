# Common Library Equivalents Across Languages

## HTTP / Web Framework
| JavaScript/Node | Python | Java | Go |
|---|---|---|---|
| express | Flask / FastAPI | Spring Boot | net/http / Gin |
| fastify | Starlette | Quarkus | Echo |
| koa | Django | Micronaut | Fiber |

## Testing
| JavaScript/Node | Python | Java | Go |
|---|---|---|---|
| Jest | pytest | JUnit 5 | testing (stdlib) |
| Mocha + Chai | unittest | TestNG | testify |
| Vitest | nose2 | Mockito | gomock |

## ORM / Database
| JavaScript/Node | Python | Java | Go |
|---|---|---|---|
| Sequelize | SQLAlchemy | Hibernate | GORM |
| Prisma | Tortoise ORM | Spring Data JPA | sqlx |
| Knex.js | Peewee | jOOQ | ent |
| mongoose (MongoDB) | MongoEngine | Spring Data MongoDB | mongo-driver |

## Authentication / Crypto
| JavaScript/Node | Python | Java | Go |
|---|---|---|---|
| jsonwebtoken | PyJWT | jjwt | golang-jwt |
| bcrypt | bcrypt | BCrypt (Spring) | bcrypt (x/crypto) |
| passport | authlib | Spring Security | — |

## HTTP Client
| JavaScript/Node | Python | Java | Go |
|---|---|---|---|
| axios | requests / httpx | OkHttp | net/http (stdlib) |
| node-fetch | aiohttp | Feign | resty |
| got | urllib3 | HttpClient (Java 11+) | — |

## Validation
| JavaScript/Node | Python | Java | Go |
|---|---|---|---|
| zod | pydantic | Bean Validation | validator |
| joi | marshmallow | Hibernate Validator | — |
| yup | cerberus | — | — |

## Logging
| JavaScript/Node | Python | Java | Go |
|---|---|---|---|
| winston | logging (stdlib) | SLF4J + Logback | log/slog (stdlib) |
| pino | structlog | Log4j2 | zerolog |
| morgan (HTTP) | loguru | — | — |

## Environment / Config
| JavaScript/Node | Python | Java | Go |
|---|---|---|---|
| dotenv | python-dotenv | Spring @Value | godotenv |
| config | dynaconf | Spring Cloud Config | viper |

## Async / Concurrency Patterns
| JavaScript | Python | Java | Go |
|---|---|---|---|
| async/await | async/await (asyncio) | CompletableFuture | goroutines + channels |
| Promise.all() | asyncio.gather() | CompletableFuture.allOf() | sync.WaitGroup |
| EventEmitter | asyncio.Event | CompletableFuture callbacks | channels |
| setTimeout | asyncio.sleep | ScheduledExecutor | time.Sleep |
