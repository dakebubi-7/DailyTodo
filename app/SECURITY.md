# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| `1.0.x` | Yes |
| Older versions | Best effort |

## Reporting a vulnerability

Please do not open a public issue for a suspected security vulnerability.

Instead, contact the repository owner through the private security contact available on the GitHub profile or repository security page. Include:

- a short description of the issue;
- affected version and operating system;
- reproducible steps or a minimal proof of concept;
- impact and any suggested mitigation.

Please remove API keys, Obsidian vault paths, personal tasks, and other private data from the report.

## Security expectations for local development

- Keep provider API keys in local application settings or environment variables; never commit them.
- Treat exported task data, logs, and Obsidian notes as private.
- Review third-party provider and Obsidian permissions before enabling integrations.
- The unsigned Windows installer may trigger SmartScreen because it is not code-signed yet. Verify the release checksum/source when distributing it.
