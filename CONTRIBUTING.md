[localize-link]: https://github.com/ilyhalight/localize/tree/master/packages/localize-tui
[votjs-link]: https://github.com/FOSWLY/vot.js

# Contributing guide

If possible, all new code **SHOULD BE** written with TypeScript. **AVOID** comits of files from `dist` folder.

## localization

All phrases **MUST BE** added to the `Phrase` and `Phrases` types in [localization.ts](./src/types/localization.ts).

It's **RECOMMENDED** to automatically generate all the necessary phrases and types using the [localize][localize-link] script.

In this project, it's available using:

```bash
bun localize
```

or

```bash
npm localize
```

You can change the translation service in the [l10n.config.json](./l10n.config.json), but you **SHOULD NOT** commit it.

If you are editing the translation manually, then you **MUST** update the hash using [localize][localize-link] script.

![example](https://github.com/user-attachments/assets/2fcd3f70-aee6-4b45-827e-2fbe0d2cf599)

## hls.js

You **SHOULDN'T** update the hls.js version in the [package.json](./package.json) without updating in [headers.json](./src/headers.json)

## vot.js

**DON'T forget** to pass `{ fetchFn: GM_fetch }` option to `getVideoID` and `getVideoData`

### Adding support for new sites

To add support for a new sites, you need make neaccessary changes in [vot.js][votjs-link] and then add domain to match list in [headers.json](./src/headers.json).

Also, **DON'T forget** to add new paths to the [wiki data](./scripts/wiki-gen/data.js). This doesn't affect the functionality of the extension, but it is better to keep the wiki up to date.

### Updating @vot.js/\* packages

Install new version of `@vot.js/...` with

```bash
npm install @vot.js/...
```

If patches broken after casual:

1. Usually necessary only in Bun:

   1. Remove "postinstall" script from package.json
   2. Remove `@vot.js/...` package with

   ```bash
   npm uninstall @vot.js/...
   ```

   3. Install new version of `@vot.js/...` with

   ```bash
   npm install @vot.js/...
   ```

   4. Restore "postinstall" script in package.json
   5. Run patch-package

   ```bash
   npx patch-package
   ```

2. Get errors log with

```bash
npx patch-package --partial
```

3. Fix errors from patch-package-errors.log
4. Run patch-package update

```bash
npx patch-package @vot.js/...
```

5. Repeat 2-5 steps before success applying patches

### How to patch?

You **SHOULD NOT** patch the main logic and functionality of vot.js, e.g. add support for a new website or a new endpoint by patching, instead of this make changes in [vot.js repo][votjs-link].

Steps to patch:

1. Make changes in `node_modules/@vot.js/<package_name>/dist/<file_name>`
2. Save changes with:

```bash
npx patch-package @vot.js/<package_name>
```

**DON'T** use patches from `bun patch` or from any other npm packages. They may not be compatible with `patch-package` and may break when updating the package.
