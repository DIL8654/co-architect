# Architecture Principles

## Scalability

- **Design for workload separation**: split interactive, batch, and background workloads. This matters because one heavy path can slow everything else. Apply when traffic or processing volume can spike.
- **Prefer asynchronous processing for heavy tasks**: move long-running work off the request path. This matters because it protects user experience and improves throughput. Apply for uploads, document processing, media analysis, and integrations.
- **Remove single bottlenecks early**: find the one service or database path that will cap growth. This matters because scaling fails when one narrow point stays fixed. Apply when one shared component serves many users or pipelines.

## Reliability

- **Design for failure and recovery**: expect services, jobs, and networks to fail sometimes. This matters because resilient systems recover faster and lose less work. Apply to every critical workload.
- **Protect critical data with backup and restore paths**: plan how data is recovered, not just how it is stored. This matters because storage without restore is not real protection. Apply when data loss would hurt the business or customers.
- **Make dependencies observable and retry-safe**: monitor critical calls and handle temporary failure cleanly. This matters because hidden dependency failure turns into larger incidents. Apply when external services or queues are involved.

## Security

- **Protect identity and access boundaries**: make it clear who can do what. This matters because weak access control creates the fastest path to major incidents. Apply when users, admins, or partners interact with the system.
- **Treat secrets as managed assets**: store keys and credentials in managed secret systems. This matters because hardcoded or loosely shared secrets are high-risk. Apply whenever services authenticate to other services.
- **Reduce attack surface at ingress and integration points**: secure APIs, uploads, and external entry paths first. This matters because exposed boundaries are the most common attack targets. Apply when the system accepts outside traffic or files.

## Maintainability

- **Keep boundaries clear and decisions documented**: separate concerns and record important choices. This matters because teams move faster when the system is easier to understand. Apply when the architecture spans many components or teams.
- **Prefer simple designs until complexity is justified**: start lean and add structure when there is evidence. This matters because unnecessary complexity increases delivery cost. Apply during early product growth and platform evolution.
- **Make systems easier to test and change**: favor designs that allow safe iteration. This matters because architecture that cannot change becomes a business drag. Apply to shared services, pipelines, and integration-heavy systems.

## Cost

- **Match service choice to workload value**: spend more where it protects important outcomes. This matters because cheap choices can become expensive if they create outages or rework. Apply when selecting storage, compute, or data services.
- **Use lifecycle and retention controls**: keep expensive data only as long as it helps. This matters because unused storage and logs quietly grow cost. Apply to blobs, backups, media, documents, and audit data.
- **Scale expensive capabilities deliberately**: control the parts of the system that burn the most money. This matters because AI, media, and high-throughput workloads can spike cost quickly. Apply when compute-heavy analysis is involved.

## Compliance

- **Minimize sensitive data exposure**: only keep the data the system really needs. This matters because every extra data copy raises privacy and audit risk. Apply when personal, financial, or regulated data is present.
- **Keep evidence for audit and accountability**: record the actions and controls that matter. This matters because teams need to prove what happened, not just assume it. Apply when business or security review depends on traceability.
- **Design retention and deletion intentionally**: know how data is kept, archived, and removed. This matters because privacy and governance obligations often depend on lifecycle control. Apply when customer or employee data is stored.

## Operations

- **Make health, logs, and traces visible**: give operators enough signal to understand the system. This matters because hidden failures take longer to fix. Apply to all critical services and background workflows.
- **Automate repeatable operational tasks**: remove manual work where failure is predictable. This matters because reliability drops when routine operations depend on memory. Apply to deployment, recovery, rotation, and maintenance tasks.
- **Prepare for incident response and change control**: know how to react when things go wrong. This matters because fast response reduces customer and business impact. Apply when the system supports production users or regulated workloads.
