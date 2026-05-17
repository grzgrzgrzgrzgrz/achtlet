# Security Policy

## Supported Versions

Security fixes are only guaranteed for the latest commit on `main` and the
latest tagged release.

## Reporting a Vulnerability

Please do not open a public issue for a suspected vulnerability.

Use one of these channels instead:

1. GitHub's private "Report a vulnerability" flow for this repository.
2. Direct contact with the maintainer if private reporting is not available.

Include:

- A short description of the issue
- Steps to reproduce
- Impact and affected versions
- Any mitigation ideas you already tested

You can expect an initial response within a few days for well-scoped reports.

## Scope Notes

`Achtlet` is a thin management layer around the n8n API. Reports are most helpful
when they clearly distinguish between:

- vulnerabilities in `Achtlet`
- insecure deployment of `Achtlet`
- vulnerabilities in the upstream n8n instance

Deployment issues still matter, but they may be handled as documentation or
hardening work rather than code vulnerabilities.
