export class DatabaseError extends Error {
    constructor(
        public readonly operation: string,
        public readonly siteId?: string,
        public readonly cause?: unknown
    ) {
        const msg = cause instanceof Error ? cause.message : String(cause ?? "unknown database error");
        super(`[${operation}] ${msg}${siteId ? ` for site ${siteId}` : ""}`);
        this.name = "DatabaseError";
    }
}