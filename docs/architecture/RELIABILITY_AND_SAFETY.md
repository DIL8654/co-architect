# Reliability And Safety

## Purpose

Describe the reliability and safety posture of the current MVP.

## Current Scope

The hackathon MVP focuses on predictable local operation, explainable reasoning, and safe demo data boundaries.

## Reliability Measures

- mock AI provider fallback
- TiDB-backed persistence path
- persisted analysis snapshots
- Problem Details API errors
- local Docker plus Vite development flow

## Safety Measures

- synthetic and demo data only
- no secrets committed to the repo
- deterministic score calculation in application code
- explicit critic or verifier stage
- grounded context and citation references

## Design Decisions

- do not pretend that AI calculates the final score
- keep current auth intentionally simple for evaluator usability
- separate current scope from future enterprise ambitions

## Future Enhancements

- real identity and RBAC
- deeper telemetry
- automated evaluation harnesses
- stronger connector governance
