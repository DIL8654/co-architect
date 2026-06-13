# Trade-off Catalog

## Consistency vs Availability

- **Decision context**: distributed systems, multi-region data, or workloads that keep running during partial failure.
- **Pros**: strong consistency reduces confusing data states; high availability protects user access during incidents.
- **Cons**: stronger consistency can reduce resilience; higher availability can accept temporary data divergence.
- **Recommendation guidance**: bias toward consistency for financial or control-heavy workflows. Bias toward availability for user-facing systems that can tolerate short-lived staleness.

## Cost vs Performance

- **Decision context**: compute-heavy APIs, analytics, AI, or latency-sensitive user flows.
- **Pros**: lower cost reduces spend; higher performance improves responsiveness and throughput.
- **Cons**: aggressive savings can create slow systems; aggressive performance tuning can waste budget.
- **Recommendation guidance**: bias toward performance on user-critical paths. Bias toward cost for non-urgent jobs and lower-value processing.

## Cost vs Reliability

- **Decision context**: backup strategy, redundancy, DR, and resilience controls.
- **Pros**: lower cost keeps the platform lean; stronger reliability reduces outage and data-loss risk.
- **Cons**: underinvesting in resilience increases recovery risk; overinvesting can outpace business value.
- **Recommendation guidance**: bias toward reliability for customer-critical systems and important data. Bias toward cost only when the business impact of failure is clearly low.

## Speed vs Governance

- **Decision context**: fast delivery teams, platform changes, and architecture decisions with broad impact.
- **Pros**: speed helps teams learn and ship faster; governance improves consistency and risk control.
- **Cons**: too much speed can create drift; too much governance can slow delivery and reduce ownership.
- **Recommendation guidance**: bias toward speed for low-risk experiments. Bias toward governance for shared platforms, regulated systems, and cross-team changes.

## Security vs Usability

- **Decision context**: authentication, approvals, admin workflows, and external user flows.
- **Pros**: stronger security lowers exposure; better usability reduces user friction and support cost.
- **Cons**: too much security can block legitimate work; too much convenience can weaken protection.
- **Recommendation guidance**: bias toward security for privileged actions and sensitive data. Bias toward usability only after minimum controls are clearly in place.

## Managed vs Self-Hosted

- **Decision context**: choosing data stores, messaging, observability, or AI infrastructure.
- **Pros**: managed services reduce operational burden; self-hosted platforms increase control and flexibility.
- **Cons**: managed services can raise lock-in and cost; self-hosted systems demand more expertise and maintenance.
- **Recommendation guidance**: bias toward managed services for MVP and small teams. Bias toward self-hosted only when control, portability, or cost patterns justify it.

## Build vs Buy

- **Decision context**: identity, search, workflow, observability, or domain-specific platform features.
- **Pros**: building gives control; buying reduces time to value.
- **Cons**: building increases long-term ownership cost; buying can constrain customization.
- **Recommendation guidance**: bias toward buy when the feature is common and non-differentiating. Bias toward build when the capability creates strategic advantage.

## Simplicity vs Scalability

- **Decision context**: whether to add queues, partitioning, caching, or orchestration early.
- **Pros**: simplicity lowers delivery and maintenance cost; scalability protects growth and load spikes.
- **Cons**: oversimplified systems can fail under growth; overengineered systems slow teams down.
- **Recommendation guidance**: bias toward simplicity until clear scale signals appear. Bias toward scalability when workload or tenant growth is already visible.

## Platform Leverage vs Vendor Lock-In

- **Decision context**: deep use of cloud-native services or proprietary managed capabilities.
- **Pros**: platform leverage accelerates delivery; reduced lock-in preserves portability and negotiating power.
- **Cons**: heavy lock-in can limit future moves; excessive abstraction can reduce delivery speed and platform value.
- **Recommendation guidance**: bias toward platform leverage when speed matters most. Bias toward portability when regulation, cost pressure, or multi-cloud strategy is strong.

## Tenant Isolation vs Operational Cost

- **Decision context**: SaaS platforms, shared data stores, and customer separation design.
- **Pros**: stronger isolation improves security and compliance; shared infrastructure reduces cost and complexity.
- **Cons**: strong isolation increases platform cost; cheaper sharing can create customer-risk and noisy-neighbor problems.
- **Recommendation guidance**: bias toward stronger isolation when customers are enterprise, regulated, or security-sensitive. Bias toward lower-cost sharing only when risk is clearly limited.
