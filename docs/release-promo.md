# Achtlet v0.1.0 Launch Promo Kit

Use `docs/social-card.png` as the default share image for X, LinkedIn, forum
posts, and release announcements.

## Primary Links

- Repository: https://github.com/grzgrzgrzgrzgrz/achtlet
- Release: https://github.com/grzgrzgrzgrzgrz/achtlet/releases/tag/v0.1.0
- Disclaimer: https://github.com/grzgrzgrzgrzgrz/achtlet/blob/main/DISCLAIMER.md
- Screenshot card: https://github.com/grzgrzgrzgrzgrz/achtlet/blob/main/docs/social-card.png

## Positioning

Achtlet is an unofficial, self-hosted, Android-first PWA for n8n operators who
want a focused phone control surface for workflow toggles, execution checks, and
backups.

Use this short tagline when space is tight:

> Achtlet is an unofficial self-hosted mobile PWA for n8n workflow control,
> execution checks, and backups.

Always include this note in longer posts:

> Achtlet is independent and not affiliated with, endorsed by, or sponsored by
> n8n GmbH. Code is provided as-is, without warranty.

## Launch Schedule

All times are Europe/Berlin.

| Time | Channel | Action |
| --- | --- | --- |
| Mon, 2026-05-18, 15:00 | n8n Community | Post in "Built with n8n" first. This is the warmest audience. |
| Mon, 2026-05-18, 15:15 | X | Post the short launch note with `docs/social-card.png`; pin it. |
| Tue, 2026-05-19, 11:30 | LinkedIn | Post the longer builder/security story. |
| Tue, 2026-05-19, 16:30 | X | Follow-up thread: why mobile n8n admin exists, what was tested. |
| Wed, 2026-05-20, 11:30 | Reddit r/n8n | Prefer the current weekly self-promotion thread. If none is active, skip or ask mods first. |
| Thu, 2026-05-21, 15:00 | Hacker News | Optional "Show HN" only if ready to answer comments for 2 hours. |
| Fri, 2026-05-22, 11:30 | n8n Community | Reply with thanks and a tiny changelog only if there is real feedback or a fix. |
| Mon, 2026-05-25, 11:30 | DEV.to / Hashnode | Optional technical write-up after first feedback round. |

Do not post everywhere at once. The first 48 hours should feel like a careful
community release, not a link blast.

## n8n Community Post

Title:

```text
Achtlet v0.1.0 - a mobile PWA for self-hosted n8n control and backups
```

Body:

```markdown
Hi n8n community,

I published Achtlet v0.1.0, an unofficial self-hosted mobile PWA for n8n.

I built it for the small admin tasks I kept wanting from my phone: checking
workflow status, toggling workflows, inspecting recent executions, and creating
backups without opening the full n8n editor on mobile.

Release focus:

- Android-friendly installable PWA
- Docker setup for self-hosting
- password-gated UI with server-side sessions
- workflow toggles, execution checks, and backups
- CI, CodeQL, Dependabot, secret scanning, and Docker checks
- MIT licensed public repo

Repo: https://github.com/grzgrzgrzgrzgrz/achtlet
Release: https://github.com/grzgrzgrzgrzgrz/achtlet/releases/tag/v0.1.0

The code is provided as-is. I did what I could to test it, including Docker
Desktop validation, local n8n integration testing, mobile screenshots, dependency
audit, and secret scanning, but there is no warranty. Please review and adapt it
for your own setup before trusting it with an important instance.

I would love feedback from people who self-host n8n and want a focused mobile
control surface.

Achtlet is independent and not affiliated with, endorsed by, or sponsored by n8n
GmbH.
```

## X Launch Post

```text
Achtlet v0.1.0 is live.

An unofficial self-hosted mobile PWA for n8n workflow control, execution checks,
and backups from your phone.

Docker-ready, Android-installable, MIT licensed.

https://github.com/grzgrzgrzgrzgrz/achtlet

Independent project. Code is as-is, no warranty.
```

Attach `docs/social-card.png`.

## X Follow-Up Thread

Post 1:

```text
Why I built Achtlet:

I use n8n constantly, but the jobs I need on my phone are usually tiny:
is this workflow active, did the last execution fail, can I make a backup before
I touch something risky?
```

Post 2:

```text
So Achtlet is intentionally not a replacement for the n8n editor.

It is a small self-hosted mobile console for:

- workflow toggles
- status checks
- execution views
- backup creation/download/deletion
```

Post 3:

```text
Release hygiene mattered:

- Docker build
- Node 24 runtime
- server-side sessions
- login rate limiting
- CSP/security headers
- CodeQL
- secret scanning
- local n8n integration smoke
```

Post 4:

```text
It is MIT licensed and published as-is. Please review it, adapt it, and rerun
the checks before putting it near an important n8n instance.

Repo:
https://github.com/grzgrzgrzgrzgrz/achtlet
```

## LinkedIn Post

```markdown
I just published Achtlet v0.1.0.

Achtlet is an unofficial self-hosted mobile PWA for n8n. I built it for the
small everyday admin jobs I kept wanting on my phone: checking workflow status,
toggling workflows, inspecting recent executions, and creating backups without
opening the full n8n editor on mobile.

The release focus is practical:

- Android-friendly installable PWA
- Docker setup for self-hosting
- password-gated UI with server-side sessions
- workflow toggles, execution checks, and backups
- Node 24 runtime
- CI, CodeQL, Dependabot, secret scanning, and Docker checks
- MIT licensed public repo

I tested it with Docker Desktop, a local n8n instance, Playwright/mobile
screenshots, unit tests, production dependency audit, and secret scanning.

The code is published as-is. I did what I could, but there is no warranty and no
guarantee that it fits every environment. Please review it, adapt it with your
own toolchain, and rerun the checks before trusting it with an important n8n
instance.

Repo: https://github.com/grzgrzgrzgrzgrz/achtlet
Release: https://github.com/grzgrzgrzgrzgrz/achtlet/releases/tag/v0.1.0

Achtlet is independent and not affiliated with, endorsed by, or sponsored by n8n
GmbH.
```

Attach `docs/social-card.png`.

## Reddit r/n8n Comment

Use this in the current weekly self-promotion thread. Do not make a top-level
post unless the subreddit rules/current moderation style clearly allow it.

```markdown
I released Achtlet v0.1.0: an unofficial self-hosted mobile PWA for n8n workflow
control, execution checks, and backups.

It is meant for the phone-sized admin tasks around a self-hosted n8n instance:
toggle a workflow, inspect executions, create/download backups, and check status
without opening the full editor.

Repo: https://github.com/grzgrzgrzgrzgrz/achtlet
Release: https://github.com/grzgrzgrzgrzgrz/achtlet/releases/tag/v0.1.0

MIT licensed, Docker-ready, Node 24, tested with a local n8n instance. Provided
as-is with no warranty. Independent project, not affiliated with n8n GmbH.

Feedback from self-hosters very welcome.
```

## Hacker News Optional Post

Only post this if you can stay online and answer technical questions.

Title:

```text
Show HN: Achtlet - mobile PWA for self-hosted n8n control and backups
```

URL:

```text
https://github.com/grzgrzgrzgrzgrz/achtlet
```

First comment:

```markdown
Hi HN,

I built Achtlet because I run n8n and often want the small admin surface from my
phone: check workflow status, toggle a workflow, inspect recent executions, and
create a backup before changing something.

It is intentionally not a replacement for the n8n editor. It is a focused,
self-hosted PWA around the n8n API.

Release notes:

- Android-first installable PWA
- Docker setup
- Node 24 runtime
- server-side sessions and security headers
- workflow toggles, executions, backups
- local n8n smoke tested
- MIT licensed

It is independent from n8n GmbH and published as-is/no warranty. I would be
especially interested in feedback from people who self-host n8n or operate
automation stacks from mobile devices.
```

## Follow-Up Replies

Use these when people answer.

```text
Thanks for taking a look. My main goal was a small phone-first admin surface,
not a replacement for the full n8n editor.
```

```text
Good point. I am treating this as an as-is community release, so anything that
touches auth, backups, or API keys should stay conservative and easy to audit.
```

```text
If you try it with your own self-hosted n8n setup, I would love to know which
mobile flow felt useful and which one got in your way.
```

## Do Not Do

- Do not DM random n8n team members.
- Do not pretend it is an official n8n project.
- Do not omit the as-is/no-warranty language in long posts.
- Do not post to Reddit as a top-level link if a self-promotion thread is active.
- Do not launch on Product Hunt yet unless there is a simple public landing page,
  a short demo video/GIF, and time to support the launch day.
