# Architecture Intelligence Score (AIS)

Architecture Intelligence Score is the official scoring model of CoArchitect AI.

Standards:

- Azure Well-Architected Framework
- AWS Well-Architected Framework
- ISO/IEC 25010
- OWASP ASVS

Dimensions:

Security = 20

ReliabilityAvailability = 18

ScalabilityPerformance = 15

OperationalExcellence = 15

DataTenantIsolation = 12

ComplianceGovernance = 10

CostOptimization = 5

Maintainability = 5

Total Weight = 100

Maturity:

0 Missing

1 Ad Hoc

2 Basic

3 Acceptable

4 Production Ready

5 Enterprise Ready

Formula:

Contribution =
(Maturity / 5) * Weight

Final Score =
Sum Contributions

Bands:

0-30 High Risk

31-50 Early MVP

51-70 Production Candidate

71-85 Production Ready

86-100 Enterprise Ready

AI may suggest maturity.

Application calculates final score.
