# Security Policy

## Supported Versions

DailySked is currently alpha software. Security fixes are applied to the latest published alpha unless a broader support policy is announced.

## Reporting a Vulnerability

Please do not open public issues for suspected security vulnerabilities.

Open a private GitHub security advisory if available. If private advisories are not available, contact the maintainers through the repository's published security contact. Include:

- A short description of the issue
- Steps to reproduce
- Impact and affected versions, if known
- Any suggested mitigation

## Token Handling Notes

DailySked includes demo-friendly Google OAuth helpers. The default token store uses httpOnly cookies so local demos and prototypes can work quickly.

Production apps should usually provide a custom `tokenStore` that persists Google refresh tokens in an encrypted server-side store and scopes access by the authenticated host-app user.
