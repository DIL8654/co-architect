# Framework Selection

## Purpose

CoArchitect AI will support both manual framework selection and explainable auto-detection so users can understand why a review used particular architecture and security lenses.

Supported frameworks:

- Azure Well-Architected Framework
- AWS Well-Architected Framework
- ISO/IEC 25010
- OWASP ASVS
- Auto-detect

## User Modes

### Manual Selection

The user explicitly selects one or more frameworks to apply.

Use when:

- the team already has a standard review process
- the cloud provider is known
- the user wants focused comparison

### Auto-Detect

The system inspects the architecture description, diagram, and context to suggest the most relevant frameworks.

The selected frameworks and rationale must always be visible to the user.

## Auto-Detection Rules

### Azure Well-Architected

Prioritize Azure Well-Architected when the architecture mentions Azure services or Azure platform patterns, such as:

- Azure App Service
- Azure Functions
- Azure API Management
- Azure Blob Storage
- Azure SQL
- Azure Kubernetes Service
- Azure Service Bus
- Microsoft Entra ID

### AWS Well-Architected

Prioritize AWS Well-Architected when the architecture mentions AWS services or AWS platform patterns, such as:

- API Gateway
- Lambda
- S3
- RDS
- ECS or EKS
- CloudFront
- SQS or SNS
- Cognito

### ISO/IEC 25010

Include ISO/IEC 25010 when the user emphasizes:

- maintainability
- usability
- compatibility
- system quality
- non-functional fit
- long-term product quality

### OWASP ASVS

Include OWASP ASVS when the system includes:

- web APIs
- authentication
- authorization
- PII
- multi-tenancy
- external users
- payment or regulated data
- administrative surfaces

### Cloud-Neutral Baseline

If the cloud provider is unknown, use a cloud-neutral baseline:

- ISO/IEC 25010
- OWASP ASVS when applicable
- generic reliability, scalability, and operability principles
- optional Azure versus AWS comparison when the recommendation depends on provider capabilities

## Selection Outputs

The Framework Selection Agent should return:

- selected frameworks
- selection rationale
- confidence score
- missing context that could change the selection
- optional alternates that were considered but not applied

## Framework Applicability Matrix

| Scenario | Azure WAF | AWS WAF | ISO 25010 | OWASP ASVS |
|---|---|---|---|---|
| Azure-native SaaS platform | High | Low | Medium | High |
| AWS-native event-driven system | Low | High | Medium | High |
| Cloud-neutral internal platform | Medium | Medium | High | Medium |
| Public web app with PII | Medium | Medium | Medium | High |
| Early product quality review | Low | Low | High | Medium |
| API-heavy multi-tenant SaaS | Medium | Medium | High | High |

## Explanation Model

The product should show a small explanation card before or alongside results:

- frameworks selected
- why each framework was chosen
- what user inputs influenced the choice
- what assumptions were made
- how the user can override the selection

Example explanation:

`Azure Well-Architected` was selected because the architecture references Azure Blob Storage and Azure-hosted APIs.

`OWASP ASVS` was selected because the system includes external users, APIs, and sensitive customer data.

`ISO/IEC 25010` was selected because maintainability and reliability were marked as high priorities.

## UX Plan

### Framework Selection Screen

Show:

- manual multi-select options
- auto-detect option
- short summaries for each framework
- why a framework might matter for this review

### Analysis Result View

Show:

- selected frameworks
- framework rationale
- confidence
- an action to revise framework selection and rerun analysis

## Safety And Review Rules

- never imply a framework was applied if the corresponding specialist agent did not run
- separate selected frameworks from suggested frameworks
- expose low confidence or incomplete context clearly
- keep framework summaries grounded to curated knowledge files

