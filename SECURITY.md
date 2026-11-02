# Security and privacy

Treat every imported field as untrusted. No imported command is executed. No referenced URL or file is fetched. HTML/Markdown are inert text; syntax highlighting creates text nodes. External links are fixed HTTPS attribution links with `noopener noreferrer`. CSP disallows inline scripts, external connections and framing in both local and hosted Studio responses.

Limits: 1 MiB before JSON parsing, 1,000 events, 16 nesting levels, 100,000 characters per string/evidence object, bounded identities/titles, explicit schema versions, strict structural keys, unique events/tool calls, preceding tool-result/retry targets and valid UTC calendar timestamps. Unsupported malformed input is rejected. Missing timestamps must be explicit null.

Known credential prefixes, bearer values, private-key blocks, common assignment patterns and sensitive keys are redacted before storage. Sensitive structural IDs are rejected when redaction would invalidate the schema. This is heuristic detection, **not a guarantee**. Free text can still contain names, prompts, source code or secrets the patterns do not recognize. Review every field in the publication preview. A source's `recorded` label is a claim, not cryptographic authenticity.

Private reads and writes require a configured token of at least 32 characters. Hosting must keep importer and publisher Workers inaccessible directly (`workers_dev:false`, no routes) and expose only Studio. The services share a host-managed token; this is a small single-owner prototype, not multi-tenant authorization. Never commit `.dev.vars`, `.env`, tokens, databases or private traces. Do not use real sensitive data on a public demonstration host until its operator has reviewed access, retention, logging and backups.

Publishing requires owner authentication, explicit `approved:true` and the exact reviewed private digest. It creates a separate immutable snapshot in a separate database. Public IDs grant read access only; they never grant private access or publishing permission. Owner revocation uses `DELETE /api/public/:id`. Reports use no-store caching. Recipients may retain their own copies.

Local mode binds loopback and rejects unexpected Host names. Owner access is represented by a random HttpOnly SameSite=Strict cookie minted at `/`; an unauthenticated remote service must never set `LOCAL_DEV:true`. Any local process with access to that browser/server trust context can act as the local owner. The developer server is not intended for public exposure.

No public security contact or hosted issue tracker exists yet. Report concerns privately to the selected repository maintainer once the repository is established; do not upload sensitive example traces to a public issue.
