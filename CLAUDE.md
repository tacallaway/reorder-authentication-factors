# Reorder Authentication Factors — Okta Sign-In Widget Prototype

## Goal

Build a minimal prototype web application that embeds the Okta Sign-In Widget (Gen2, v7.x) using the Okta Identity Engine (OIE) and allows a developer to specify a custom ordering of authentication factors (authenticators) presented to the user during the sign-in flow.

By default, the Okta Sign-In Widget renders authenticators in the order returned by the Okta server. This prototype intercepts that rendering and reorders the authenticator options according to a developer-supplied configuration.

### Key Constraints

- **Widget version**: Use the Gen2 Sign-In Widget (`@okta/okta-signin-widget` v7.x). Do NOT use Gen3 (v8+), as it does not support embedded/self-hosted deployment.
- **Engine**: Okta Identity Engine (OIE) with the Interaction Code flow. Do not set `useClassicEngine: true`.
- **Deployment model**: Embedded (self-hosted). The widget runs inside our own HTML page, not via Okta-hosted redirect.

## Codebase Structure

```
/
├── CLAUDE.md              # This file — project goals and conventions
├── package.json           # Node project manifest (Vite + dependencies)
├── vite.config.js         # Vite dev server configuration
├── .env.example           # Template for required Okta environment variables
├── index.html             # Entry HTML page that hosts the widget
└── src/
    ├── main.js            # App entry point — initializes and renders the widget
    ├── config.js           # Reads Okta config from env vars
    ├── factorOrder.js      # Developer-configurable factor ordering logic
    └── widget.js           # Widget instantiation, hooks, and lifecycle
```

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Bundler / Dev server | Vite | Fast, zero-config, native ES module support |
| Sign-In Widget | `@okta/okta-signin-widget` 7.x | Gen2 supports embedded self-hosted mode with OIE |
| Auth JS SDK | `@okta/okta-auth-js` | Required peer dependency for widget token management |
| Language | Vanilla JavaScript (ES modules) | Keeps the prototype minimal — no framework overhead |

## Development Workflow

### Prerequisites

- Node.js >= 18
- An Okta org with Identity Engine enabled
- An Okta SPA app integration configured with:
  - Interaction Code grant type enabled
  - Refresh Token grant type enabled
  - Redirect URI pointing to `http://localhost:5173/login/callback`

### Setup

```bash
npm install
cp .env.example .env
# Fill in VITE_OKTA_ISSUER, VITE_OKTA_CLIENT_ID, VITE_OKTA_REDIRECT_URI in .env
npm run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on `http://localhost:5173` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Key Conventions

### Factor Ordering

The custom factor order is defined in `src/factorOrder.js`. It exports a `FACTOR_ORDER` array of authenticator identifiers. Each identifier matches the `data-se` attribute the widget places on the `.authenticator-button` div inside each `.authenticator-row`.

The widget builds these identifiers as:
- `{authenticatorKey}` — e.g., `okta_email`, `okta_password`
- `{authenticatorKey}-{methodType}` — e.g., `okta_verify-push`, `okta_verify-totp`

This means you can order at the authenticator level (e.g., `okta_verify` to match all Okta Verify methods) or at the method level (e.g., `okta_verify-push` before `okta_verify-totp`). Any authenticator not matched falls to the end in its original server order.

Common identifiers: `okta_password`, `okta_email`, `phone_number`, `security_question`, `okta_verify-push`, `okta_verify-totp`, `okta_verify-signed_nonce`, `google_otp`, `webauthn`, `duo`, `onprem_mfa`, `rsa_token`.

### Widget DOM Structure for Authenticator Lists

The Gen2 widget renders authenticator selection screens with this structure:

```
.authenticator-list (.authenticator-verify-list or .authenticator-enroll-list)
  └── .list-content
        ├── .authenticator-row
        │     ├── .authenticator-icon-container
        │     ├── .authenticator-description
        │     │     ├── h3.authenticator-label
        │     │     └── .authenticator-button[data-se="okta_verify-push"]
        │     │           └── button.select-factor
        │     ...
        └── .authenticator-row
              ...
```

The `data-se` attribute on `.authenticator-button` is the key identifier used for reordering (built by the widget's `getButtonDataSeAttr()` function in `AuthenticatorUtil.js`).

### Widget Hooks for Reordering

The Gen2 widget supports `before`/`after` hooks keyed by remediation view names from `RemediationConstants.js`. The two relevant views are:

- `select-authenticator-authenticate` — shown when choosing a factor to verify during sign-in
- `select-authenticator-enroll` — shown when choosing a factor to enroll during registration

In the `after` hook for these views, the prototype queries the rendered `.authenticator-row` elements, reads each row's `.authenticator-button[data-se]` value, sorts them per `FACTOR_ORDER`, and re-appends them in the desired order. This is the supported DOM manipulation approach for Gen2 embedded widgets.

```js
// Conceptual example (implemented in src/widget.js)
hooks: {
  'select-authenticator-authenticate': {
    after: [reorderAuthenticatorsFn]
  },
  'select-authenticator-enroll': {
    after: [reorderAuthenticatorsFn]
  }
}
```

### Environment Variables

All Okta-specific configuration is read from environment variables prefixed with `VITE_` so Vite injects them at build time:

| Variable | Description |
|----------|-------------|
| `VITE_OKTA_ISSUER` | Full issuer URL, e.g., `https://your-org.okta.com/oauth2/default` |
| `VITE_OKTA_CLIENT_ID` | Client ID from the Okta SPA app integration |
| `VITE_OKTA_REDIRECT_URI` | Redirect URI, e.g., `http://localhost:5173/login/callback` |

### Coding Conventions

- Vanilla JS with ES module syntax (`import`/`export`).
- No TypeScript, no React, no framework — keep it minimal.
- Use `const`/`let`, never `var`.
- Prefer named exports.
- Keep each module focused on a single responsibility.
- CSS: rely on the widget's built-in styles; add minimal custom CSS only for layout.
