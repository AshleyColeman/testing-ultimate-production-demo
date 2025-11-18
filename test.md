Yes, this is possible 👍
Let’s design it properly so you get:

yarn vitest

→ spin up containers + schemas once

→ each file gets a pool of schemas

→ read tests share one schema,

→ each mutating test gets its own schema (per file, no sharing).

Below is a plan only (no heavy code), so you can implement it step by step.

1. Clear goal (per test file)

For a single test file with 5 tests, for example:

it('gets all users') → read test → uses shared read schema (same for all read tests in that file).

it('creates a user') → mutating test → gets Schema A.

it('updates a user') → mutating test → gets Schema B.

it('deletes a user') → mutating test → gets Schema C.

Rules (per file):

Read-only tests share one schema (per file).

Mutating tests each get their own schema (per file).

No schema is shared between two mutating tests in the same file.

We only care about uniqueness inside a single file, not across all files.

2. Overall architecture

We’ll have four layers:

Global infra (Vitest globalSetup)

Start Testcontainers.

Create schemas.

Export serializable infra via provide('dbInfra', ...).

Vitest config

globalSetup: ['./tests/globalSetup.ts'].

Test pool tuned for Testcontainers (e.g. pool: 'forks', maxWorkers: 5).

Schema allocator helper (per file)

Reads dbInfra via inject('dbInfra').

Knows which schemas belong to which service.

Exposes:

createSchemaAllocator(serviceName: string)

returns { useReadSchema, useWriteSchema }.

Tests

Use useReadSchema for read-only tests.

Use useWriteSchema for create/update/delete tests.

3. Global infra – what it needs to return

You already have:

initializeInfrastructure();
cleanupInfrastructure();
getInfrastructure();
CONTAINER_COUNT;
TOTAL_SCHEMAS;

We extend initializeInfrastructure (or wrap it) so that it returns something like:

type SchemaMeta = {
id: number; // unique within project
service: string; // 'auth', 'payments', etc
schemaName: string; // 'auth_schema_1'
host: string;
port: number;
database: string;
username: string;
password: string;
};

And a top-level object:

type SerializableInfra = {
schemas: SchemaMeta[];
};

Global setup responsibilities:

Call initializeInfrastructure.

Build SerializableInfra.

provide('dbInfra', serializableInfra).

Return teardown function which calls cleanupInfrastructure.

So from the test side, we can do:

const infra = inject('dbInfra'); // typed via ProvidedContext
infra.schemas // → list of all schema configs

4. Schema allocation strategy

We define a convention:

4.1 Per service partition

For each service (e.g. 'auth'):

Take all schemas with schema.service === 'auth'.

Sort them by id.

Partition into:

readSchema: serviceSchemas[0] (first one)

writeSchemas: serviceSchemas[1..] (all the rest)

If later you want more than one read schema, we can adjust, but start simple.

4.2 Per file allocator (in-process)

In each test file we’ll create a local allocator:

It holds:

readSchema (fixed).

writeSchemas (array).

writeIndex (starts at 0).

useReadSchema(fn):

Always uses the same readSchema for that file.

useWriteSchema(fn):

Picks writeSchemas[writeIndex].

Increments writeIndex (writeIndex++).

If you run out (more mutating tests than write schemas), either:

Throw an error (explicit fail), or

Wrap around and log a warning (but then they are not fully isolated anymore).

Because this allocator lives in the module scope of the test file:

It is unique per file and per worker.

It only manages the 5–10 tests in that file.

You don’t need cross-process coordination.

We will also keep tests non-concurrent per file (no sequence.concurrent) to keep it simple and deterministic.

5. Test helper API design

Design a helper module, e.g. tests/schemaAllocator.ts, that will be used by every test file.

5.1 Input

serviceName: string – maps to the microservice schemas (auth, payments, etc).

Optional options later (like resetDataBeforeEach).

5.2 Output

It returns an object with wrappers for tests:

useReadSchema(testFn)

For read-only tests.

Gives you a DB client bound to the shared read schema.

useWriteSchema(testFn)

For mutating tests.

Gives you a DB client bound to a unique schema per test.

5.3 How tests will look

In a test file:

import { describe, it } from 'vitest';
import { createSchemaAllocator } from '../../tests/schemaAllocator';

const { useReadSchema, useWriteSchema } = createSchemaAllocator('auth');

describe('Auth Service', () => {
it('should get all users (read)', useReadSchema(async ({ db }) => {
// SELECT only
}));

it('should create a user', useWriteSchema(async ({ db }) => {
// INSERT, UPDATE, DELETE
}));

it('should update a user', useWriteSchema(async ({ db }) => {
// mutate
}));
});

Where db is:

a pg Pool, or

a Prisma client instance created for that schema (depending on how you want to access DB).

6. Lifecycle per test (what actually happens)

For read tests (useReadSchema):

First time useReadSchema is called in that file:

Allocator:

finds readSchema.

creates a DB client.

optionally sets search_path to that schema.

Stores this client inside the allocator.

Every subsequent read test reuses the same client / schema.

At the end, the allocator can optionally close the client in an afterAll hook (you can centralise this in the helper).

For mutating tests (useWriteSchema):

Each call:

Allocator picks writeSchemas[writeIndex] for that test.

Creates a new DB client pointing at that schema.

Optionally runs migrations / seed just for that schema.

Passes client to the test function.

After test finishes:

Optionally clean up data in that schema, or just drop/recreate next time.

writeIndex increments, so the next mutating test gets the next schema.

This gives you one schema per mutating test in that file.

7. Vitest config and constraints

To make this stable:

pool

Use pool: 'forks' (Prisma + Testcontainers are happier with child processes than worker threads).

maxWorkers

Set to the number of containers or a bit less (e.g. 5 workers for 5 containers).

sequence.concurrent

Keep sequence.concurrent = false (default) for now to keep per-file ordering deterministic.

No master orchestrator test file

Remove or disable the giant ultimateProductionDemo orchestrator.

Let Vitest discover all \*.test.ts files normally.

The “demo” can be kept as a docs / example, but not used to drive test execution.

8. Implementation steps (in order)

You can follow this as a checklist:

Global infra

Update initializeInfrastructure to return schema metadata in a serializable format.

Add tests/globalSetup.ts that:

calls initializeInfrastructure,

builds SerializableInfra,

calls provide('dbInfra', infra),

returns teardown (cleanupInfrastructure).

Vitest config

Create vitest.config.ts with:

test.globalSetup = ['./tests/globalSetup.ts'],

test.pool = 'forks',

test.maxWorkers = CONTAINER_COUNT (or hardcoded number).

TypeScript augmentation

Add tests/vitest.shims.d.ts to extend ProvidedContext with dbInfra.

Schema allocator helper

Create tests/schemaAllocator.ts that:

uses inject('dbInfra'),

groups schemas by service,

implements createSchemaAllocator(serviceName) returning:

useReadSchema,

useWriteSchema.

Update one microservice test file as a pilot

Convert auth tests to use createSchemaAllocator('auth').

Mark tests as read vs write by using different wrappers.

Roll out to other microservices

Apply same pattern to payments, inventory, etc.

Remove master orchestrator

Once all files are migrated and you’re happy with the behaviour, delete or archive the big orchestrator test.
