## Threat Model

Assets: user data, tokens, connection secrets, run histories. Actors: end users, operators, external providers, attackers. Entry points: REST, WS, webhooks, admin. Threats: auth bypass, CSRF, token leakage, SSRF via tool outputs, rate‑limit evasion. Mitigations: strict authZ, CSRF tokens, secret scoping, output validation/sandboxing, provider quotas.


