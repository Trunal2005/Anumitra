# Anumitra documentation

Anumitra is an independent student prototype for SIH26262. Use the repository [README](../README.md) for native setup, startup commands and local URLs.

## Implementation and demonstration

| Document | Purpose |
|---|---|
| [Architecture](ARCHITECTURE.md) | Components, persistence and workflow invariants |
| [Requirements](REQUIREMENTS.md) | PS A–F coverage with implemented, partial and missing capabilities |
| [Implementation status](IMPLEMENTATION_STATUS.md) | Current implementation summary, followed by clearly labelled historical status |
| [API](API.md) | API behaviour and commands |
| [Permissions](PERMISSIONS.md) | Roles, intersected scope and human authority |
| [Demo guide](DEMO_GUIDE.md) | Rehearsal with fictional evidence and separate accounts |
| [Zero-cost setup](ZERO_COST_SETUP.md) | Local operation and isolated verification |
| [Design fidelity](DESIGN_FIDELITY.md) | UI conventions and recorded visual evidence |

## Verification and boundaries

| Document | Purpose |
|---|---|
| [Current product verification](TEST_REPORT_2026-10-26.md) | 26 October source, complete gate, retained failures, provenance and remaining limits |
| [Local integration contract](INTEGRATION_CONTRACT.md) | Fictional simulator, reviewed master import and future authorized boundary |
| [Earlier repair verification](TEST_REPORT_REPAIR.md) | Historical 23 October gate and repairs |
| [Submission readiness](SUBMISSION_READINESS.md) | Bounded prototype readiness and external limitations |
| [Repair findings](REPAIR_PLAN.md) | Reviewed correctness findings and regression mapping |
| [Security and limitations](SECURITY_AND_LIMITATIONS.md) | Implemented controls and remaining security/operational limits |
| [Policy register](POLICY_REGISTER.md) | Source provenance and DEMO numeric assumptions |
| [Attribution](ATTRIBUTION.md) | Dependency and asset notices; no project licence selected |

## Historical evidence

[Original test report](TEST_REPORT.md), [failed 0d6faa2 checkpoint](TEST_REPORT_REPAIR_0d6faa2.md) and [passing 3c01372 checkpoint](TEST_REPORT_REPAIR_3c01372.md) belong to their recorded revisions. They are retained alongside the raw outputs and captures in [evidence](evidence/) so failures and earlier results remain traceable. They do not substitute for the current report or establish verification of later code.

The repository keeps source, dependency manifests/lockfile, migrations, tests, operational scripts, configuration and supporting documentation. Local credentials, databases, private uploads, backups, dependency directories, build output and transient test output are excluded by [.gitignore](../.gitignore). Video and handoff deliverables are stored outside the checkout.

The repository cleanup on 26 October 2026 removed only the obsolete root AI build prompt and added this navigation. It did not change application source, configuration or tests, rerun the application verification suite, or change the source revision to which existing results apply. The original prompt remains recoverable from Git history.
