# ODP v0.5 Docs Review Plan

This is a discussion-first plan for the documentation pass that follows the v0.5 schema and ABI lock. It is intentionally separate from implementation work so README/SPEC structure is only rewritten once.

## Goals

- Remove v0.4/v0.5 terminology drift across onboarding, deploy docs, and protocol references.
- Separate normative v0.5 protocol material from historical release notes and migration context.
- Reframe creator/profile wording consistently:
  - `C` = person
  - `B` = entity
  - `P` / `M` = attestor or institution roles in product copy where appropriate
- Align old category/subtype language with the v0.5 taxonomy:
  - `domain`
  - `objectType`
  - `contentClass`
  - lifecycle status
  - AI status
  - verification method
  - edition model

## Review Scope

- `README.md`
- `SPEC.md`
- `docs/README.md`
- `docs/V0.4.md`
- future `docs/V0.5.md`
- relevant RU mirrors under `localization/ru/`

## Problems To Review

1. Mixed historical and current language:
   - some pages still present v0.4.x as current while the code and UI now target v0.5.
2. Onboarding and protocol content are interleaved:
   - users looking for "how do I mint/verify" and users looking for normative format rules land in the same places.
3. Taxonomy drift:
   - older docs speak in categories/subtypes while the implementation now uses `objectType` + `contentClass` + refinement tags.
4. Role wording ambiguity:
   - `C/B/P/M` are protocol types, but user-facing copy should make attestor/institution meaning clearer.
5. Mutable-state model is under-explained:
   - docs need a clean distinction between immutable hash-bound `passport.json` fields and mutable on-chain state fields.

## Proposed Deliverables

1. A short review note listing concrete doc problems by file.
2. A target information architecture for:
   - onboarding
   - normative protocol/spec
   - release history / historical lines
3. A rewrite plan with file-by-file ownership and sequencing.
4. A terminology checklist to apply in both EN and RU docs.

## Suggested Structure Direction

- `README.md`: concise onboarding for the current reference line.
- `SPEC.md`: normative v0.5 only, with historical notes moved out unless strictly necessary.
- `docs/V0.5.md`: narrative release/line overview for the v0.5 branch.
- `docs/V0.4.md`: clearly historical.
- `docs/README.md`: doc map with current vs historical split.

## Open Questions For The Discussion Pass

1. Should product copy say "attestor" everywhere for `P`, with protocol type retained only where technically necessary?
2. Should `M` remain a separate visible type in user docs, or be described as a specialized attestor/institution profile?
3. How much mutable-state explanation belongs in `README.md` versus `SPEC.md`?
4. Should `.odpass` hosting and verification stay in root onboarding docs or move into a dedicated guide?

## Execution Rule

Do this review before any broad README/SPEC rewrite. The v0.5 implementation is now the baseline; documentation should be reorganized around that settled model rather than patched incrementally.
