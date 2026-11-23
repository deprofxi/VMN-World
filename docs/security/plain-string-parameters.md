# Plain-string parameters reaching markup unescaped

**Generated file — do not edit.** Regenerate with:

```
UPDATE_TAINT_DOC=1 npx vitest run tests/unit/html-escape-taint.test.ts
```

## What this records

The escape-taint instrument treats every `string` parameter of a renderer as
external — the same assumption it already makes for `req`/`query`/`params` — and
then asks what each caller actually passes. A site is safe when every
in-repository call hands that parameter a string literal, an escaped value, a
module-level constant (including a property of one, and a value returned from a
registry accessor that returns such a table), a parameter the next function up
also only receives safe values for (`forwarded` — followed up to four hops, with
the chain printed below), or when the renderer has no caller at all.

The seeding is by **type**, not by name: `title: string` and
`title: string | undefined` are both external, and the name is looked for
anywhere in the interpolation, so `${flag ? title : ""}` and
`${"prefix " + title}` are listed as well as `${title}`. A fragment builder
that escapes *every* interpolation in its statement is not itself tainted
(`rows = sessions.map(r => `<td>${escapeHtml(r.name)}</td>`)`), so the evidence
stays about parameters rather than about pre-escaped table markup.

A parameter that is *not* typed `string` is judged by the taint pass instead:
a value handed to it across a file boundary (`renderX(item: SomeRecord)` fed by
a repository read) makes the site a finding rather than a proved exception, and
the finding prints the call site that carried the value. That edge is followed
through every spelling it can take — a renamed import (`{ renderX as paint }`),
a namespace import (`renderers.renderX(…)`), an arrow-bound export, or a
shorthand object argument (`{ title }`) — so nothing in this document excuses a
site because the call wrote a different name than the declaration.

One limit of this document is the instrument's, not the parameters': markup is
judged **per line**, as in the census, so an interpolation on a tag-less line of
a markup template is not listed here. `docs/design-debt-register.md` (DEBT-009)
names the sites that class hid when it was probed.

Only `request-derived` and an unresolved `unknown` fail
`tests/unit/html-escape-taint.test.ts`. Every verdict here is generated from the
call graph, so the honest false positives — a caller forwarding a parameter that
is a literal one level up, a renderer reached from outside this repository — are
documented rather than excused in a hand-written list. There is deliberately
nowhere to add such an exception by hand.

Sites found: **0**. Safe by call site: **0**.
Failing: **0**. Provided by a module constant: **0**.
Resolved through forwarding: **0**. Public entry points (no in-repository caller): **0**.

The census in DEBT-009 counts every unescaped interpolation; this document
records the subset the taint pass reaches through a parameter, and why each one
is not a hole *today*. It is evidence about callers, not a claim that the
renderer is safe if a new caller appears: a new call site changes this file, and
a request-derived argument fails the build.

## Sites

