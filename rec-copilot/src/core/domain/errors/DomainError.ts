export abstract class DomainError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly details?: Record<string, unknown>
    ) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}