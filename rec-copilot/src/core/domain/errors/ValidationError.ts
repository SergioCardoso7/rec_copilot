import { DomainError } from "./DomainError";


export type ValidationIssue = {
    field: string;
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export const requiredIssue = (field: string): ValidationIssue => ({
    field,
    code: "required",
    message: `${field} is required`,
});

export const invalidFormatIssue = (
    field: string,
    expected: string
): ValidationIssue => ({
    field,
    code: "invalid_format",
    message: `${field} has invalid format – expected ${expected}`,
});


export class ValidationError extends DomainError {

    public readonly issues: ValidationIssue[];

    constructor(issues: ValidationIssue | ValidationIssue[]) {

        const issueArray = Array.isArray(issues) ? issues : [issues];

        const first = issueArray[0];
        const mainMessage = issueArray.length === 1 ? first.message : `Validation failed (${issueArray.length} issues)`;

        super(issueArray.length === 1 ?
            `VALIDATION_${first.field.toUpperCase()}_${first.code.toUpperCase()}`
            : "VALIDATION_MULTIPLE_ISSUES",
            mainMessage,
            { issues: issueArray });

        this.issues = issueArray;
        this.name = "ValidationError";

    }

    static from(issues: ValidationIssue | ValidationIssue[]): ValidationError {
        return new ValidationError(issues);
    }

}

