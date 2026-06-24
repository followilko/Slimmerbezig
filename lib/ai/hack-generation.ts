/**
 * Server-side hack generation helpers. Re-exports client-safe draft types/constants
 * from {@link ./hack-draft} and URL ingestion from {@link ./hack-generation-url}.
 *
 * Client components must import from `@/lib/ai/hack-draft` directly — this barrel
 * pulls in `node:dns/promises` via the URL module.
 */
export * from "@/lib/ai/hack-draft"
export { extractReadableText } from "@/lib/ai/hack-generation-url"
