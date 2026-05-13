# Contributing

Thanks for helping improve DailySked.

## Development

```bash
pnpm install
pnpm dev
```

Before opening a pull request, run:

```bash
pnpm check
pnpm test
pnpm build
pnpm pack --dry-run
```

## Project Shape

DailySked is an opinionated Svelte scheduling surface for Google Calendar and Google Tasks. Keep changes aligned with that scope unless an issue or maintainer discussion says otherwise.

Good contributions include:

- UI fixes and accessibility improvements
- Svelte/SvelteKit integration improvements
- Google Calendar or Google Tasks correctness fixes
- Layout preset and documentation improvements
- Focused tests for shared behavior

Out of scope for now:

- CalDAV, Outlook, iCal, or generic provider abstractions
- Host-app-specific business workflows
- Private customer or workspace integrations

## Security

Do not include real credentials, tokens, customer data, or private workspace screenshots in issues or pull requests. See [SECURITY.md](SECURITY.md) for vulnerability reporting.
