# 0010 Use Architecture Principle Weighting For Tradeoff Balancing

## Status

Accepted

## Context

Architecture recommendations are only useful when they reflect business priorities and constraints. Different teams will reasonably prefer different outcomes, such as stronger security, lower cost, or faster delivery.

## Decision

CoArchitect AI will allow users to assign weights to principles and quality attributes. The Trade-off Balancing Agent will use those weights to compare options and explain why a recommendation fits the selected priorities.

## Consequences

- recommendations become more context-aware and defensible
- users gain a visible way to steer architecture reasoning
- analysis runs need to preserve the weights used for each recommendation
- trade-off outputs must show rejected alternatives and what would change under different priorities

