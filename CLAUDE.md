# API Arena — Claude Code memory

The project rules live in `.cursor/rules/` and are the single source of truth,
shared with Cursor. They are imported below so Claude Code and Cursor always stay
in sync: edit the `.mdc` files, never duplicate them here.

Ponytail (lazy-senior-dev mode) is installed as a Claude Code plugin and applied
always-on, so `.cursor/rules/ponytail.mdc` is intentionally not imported here to
avoid loading it twice.

## Project rules (canonical, shared with Cursor)

@.cursor/rules/api-arena-project-spec.mdc
@.cursor/rules/api-arena-project-progress.mdc
@.cursor/rules/api-arena-project-progress-sync.mdc
@.cursor/rules/api-arena-brand-identity.mdc
@.cursor/rules/api-arena-commits-and-docs-language.mdc
@.cursor/rules/api-arena-docker-rebuild.mdc
