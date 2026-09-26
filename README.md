# OpenPlanr Marketplace

> **Generated distribution mirror — canonical source is [openplanr/OpenPlanr](https://github.com/openplanr/OpenPlanr).**
> Each `openplanr` release is projected into this repository by the release train. Open issues
> and pull requests in OpenPlanr, not here.

Claude Code plugin marketplace for [OpenPlanr](https://github.com/openplanr/OpenPlanr). It serves
one plugin, `planr`: host-native OpenPlanr planning, delivery, review, design, and operating
skills.

## Install in Claude Code

```text
/plugin marketplace add openplanr/marketplace
/plugin install planr@openplanr
```

Restart Claude Code so it loads the skills, then invoke one as `/planr:<skill>`, for example
`/planr:spec`.

Several skills call the `planr` CLI, which ships in the `openplanr` npm package. The primary
installation is that package, whose `planr setup` installs the same generated plugin as
`planr@openplanr-local`. Use one path, not both:

```bash
npm install -g openplanr
planr setup --runtime claude --scope user
```

The [getting started guide](https://github.com/openplanr/OpenPlanr/blob/main/docs/getting-started.md)
covers scopes, what setup writes, and how to undo it.

## Plugin

<!-- plugin-table:start -->
| Plugin | Version | Description |
|---|---|---|
| [`planr`](https://github.com/openplanr/OpenPlanr/tree/openplanr@2.2639.2/packages/cli) | 2.2639.2 | Host-native OpenPlanr planning, delivery, review, design, and operating skills. Generated from [`openplanr@2.2639.2`](https://www.npmjs.com/package/openplanr/v/2.2639.2). |
<!-- plugin-table:end -->

The release train writes this table, `.claude-plugin/marketplace.json`, and `plugins/planr/`
together from the published npm package of the same version.

## Support

Questions, bug reports, and security reports follow OpenPlanr's
[SUPPORT.md](https://github.com/openplanr/OpenPlanr/blob/main/SUPPORT.md) and
[SECURITY.md](https://github.com/openplanr/OpenPlanr/blob/main/SECURITY.md).

## License

Each plugin in this marketplace ships under its own license. The marketplace metadata itself is MIT.
