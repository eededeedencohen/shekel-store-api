# Contributing

## Branching model

Git Flow with two long-lived branches:

| Branch | Purpose |
|---|---|
| `main` | Production. Only release merges land here. Tagged with `vX.Y.Z`. |
| `develop` | Integration. All feature work merges here first. |

Short-lived branches:

| Prefix | When to use | Branched from | Merged into |
|---|---|---|---|
| `feature/<slug>` | New work, refactors, additions | `develop` | `develop` |
| `bugfix/<slug>` | Non-urgent bug fixes | `develop` | `develop` |
| `release/<version>` | Stabilising a release | `develop` | `main` and `develop` |
| `hotfix/<slug>` | Urgent production fix | `main` | `main` and `develop` |

Always merge with `--no-ff` so the merge commit is preserved and the branch
boundary is visible in `git log --graph`.

## Commit messages

Conventional Commits — short imperative subject, no trailing period.

```
<type>(<scope>): <subject>
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`,
`perf`, `style`.

Examples:

```
feat: add contract publish endpoint
fix(signatures): reject duplicate signatures with 409
chore: bump mongoose to 8.4
```

## Typical flow

```bash
# start a feature
git checkout develop
git pull
git checkout -b feature/short-slug

# ...code, commit, code, commit...

# integrate
git checkout develop
git pull
git merge --no-ff feature/short-slug
git push origin develop
git branch -d feature/short-slug
```

## Releasing

```bash
git checkout develop
git checkout -b release/v0.2.0
# bump version, last fixes
git checkout main
git merge --no-ff release/v0.2.0
git tag v0.2.0
git checkout develop
git merge --no-ff release/v0.2.0
git push origin main develop --tags
git branch -d release/v0.2.0
```

## Hotfix

```bash
git checkout main
git checkout -b hotfix/critical-thing
# fix
git checkout main
git merge --no-ff hotfix/critical-thing
git tag v0.2.1
git checkout develop
git merge --no-ff hotfix/critical-thing
git push origin main develop --tags
```
