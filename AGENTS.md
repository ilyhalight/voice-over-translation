# AGENTS.md

## User Interface Component

You MUST prefer use `vot-block` instead of `div`, `span`, `p` and etc for unified styles on every websites.

You MUST place all components inside `src/components/*` folder. You MUST use `solid-js` for creating components. All styles SHOULD BE in separated `.scss` files.

Each component MUST follow this structure:

```text
src/components/**
  ├── ComponentName.tsx
  └── ComponentName.scss
```

You SHOULD prefer using Material You (Material Design 3) like design system for creating components. You MUSTN'T use any external UI libraries (like Material UI, Ant Design, etc.) for creating components

You SHOULD be careful with `!important;` CSS rules as they might have been set for a reason and could be important for one of the supported websites.

You SHOULD use `em` or `px` instead of `rem`.

## Localization

You MUST use `localizationProvider.get("key")` for all user-facing localized strings.

Do NOT hardcode localized text directly in the source code.

If a required localization key does not exist, do NOT modify localization files manually. Ask the user to add the new string by running:

```bash
bun localize
```

Only use the new localization key after it has been added through this command.

## Commits

ALWAYS write commit messages in English. You MUST use the semantic commits format. NEVER use `src/localization/locales/*` files to write commit messages, except in the case where these are the only changes.
