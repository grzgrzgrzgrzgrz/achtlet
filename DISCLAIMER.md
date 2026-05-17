# Disclaimer

**Achtlet** is an independent community project. It is **not** affiliated with,
endorsed by, or sponsored by n8n GmbH or any of its subsidiaries.

"n8n" is a trademark of n8n GmbH. Achtlet uses the word "n8n" only to describe
compatibility with self-hosted n8n instances; it implies no partnership with
the n8n project.

## No Warranty

This software is provided "as is", without warranty of any kind, express or
implied. See [`LICENSE`](./LICENSE) for the full MIT license terms.

## Code Provided As-Is

This code is published as-is. I did what I reasonably could before release:
reviewed the code, hardened the obvious security boundaries, tested it in
Docker Desktop, verified it against a local n8n instance, and checked for
committed secrets.

That is not a guarantee. There is no warranty, no promise of fitness for your
environment, and no promise that every bug or security issue has been found.
Please read the code, run your own checks, and adapt it to your deployment. If
you use Codex, Claude, or another coding assistant to review or modify Achtlet,
that is explicitly fine; just verify the generated changes before trusting
them.

## Security Notice

Achtlet talks to your n8n instance using an API key and exposes a web UI with
password authentication. You are responsible for:

- Keeping your `APP_PASSWORD`, `SESSION_SECRET`, and `N8N_API_KEY` secret.
- Running Achtlet behind HTTPS (e.g. via a reverse proxy like Traefik, Caddy, or
  nginx) in any non-local environment.
- Restricting network access (firewall, VPN, or private network) so the
  service is not openly reachable on the public internet.

Never commit a real `.env` file or any file containing credentials. The
provided `.gitignore` is configured to prevent this by default.

## Data & Backups

The backup feature downloads workflows and credentials metadata from your
n8n instance. Treat the resulting archives as sensitive and store them
accordingly.

## Liability

The authors and contributors are not liable for any damage, data loss, or
security incident resulting from the use of this software. Use at your own
risk.
