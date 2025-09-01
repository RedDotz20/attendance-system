# Contributing

Thank you for considering contributing to this project.

Please follow these guidelines to make collaboration smooth.

Before you begin

- Read the `CODE_OF_CONDUCT.md` in the repository.
- Look for issues labeled `good first issue` or `help wanted`.

Development setup (quick)

Client

```bash
cd client
pnpm install
pnpm dev
```

Server

```bash
cd server
pnpm install
pnpm dev
```

Firmware

Open the `firmware/` folder using VS Code with PlatformIO, or use the PlatformIO CLI to build/flash.

Branching & PRs

- Use feature branches named like `feature/short-description` or `fix/short-description`.
- Open a pull request against the `dev` branch (or the branch named in the issue).
- Include a clear title and a short description of the changes.
- Link the related issue or provide reproduction steps.

Commit messages

We recommend using Conventional Commits (for example: `feat:`, `fix:`, `chore:`).

Tests, linting & checks

- Run lint and tests locally before opening a PR where applicable:

```bash
pnpm -w -r lint
pnpm -w -r test
```

Pull request checklist

- [ ] My code follows the repository style and lint rules
- [ ] I updated documentation where relevant (README, docs/)
- [ ] I added tests for any new behavior (if applicable)
- [ ] All CI checks pass

Contact

If you have questions, open an issue or reach out to the maintainers listed in `MAINTAINERS.md` (if present) or the repository owners.
