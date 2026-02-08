import { SiteRepo } from "../../domain/ports/SiteRepo";
import { Result } from "../../domain/types/Result";
import { ValidationError, requiredIssue } from "../../domain/errors/ValidationError";
import { Site } from "../../domain/entities/Site";
import { DatabaseError } from "../../../infrastructure/persistence/errors/DatabaseError";

export type CreateSiteInput = {
    name: string;
    timezone: string;
};

export type CreateSiteError = | ValidationError
    | { kind: "internal"; message: string };

export type CreateSiteResult = Result<Site, CreateSiteError>;

export class CreateSite {
    constructor(private siteRepo: SiteRepo) {

    }

    async execute(input: CreateSiteInput): Promise<CreateSiteResult> {
        const issues = [];

        const name = input.name?.trim();
        if (!name) {
            issues.push(requiredIssue("name"));
        }
        const timezone = input.timezone?.trim();
        if (!timezone) {
            issues.push(requiredIssue("timezone"));
        }

        if (issues.length > 0) {
            return {
                success: false,
                error: new ValidationError(issues)
            };
        }

        try {
            const site_id = crypto.randomUUID();

            const created = await this.siteRepo.create({
                site_id,
                name,
                timezone,
                active_constraints_json: null,
            });

            return { success: true, data: created };
        } catch (err) {

            let internalMessage = "Failed to create site";

            if (err instanceof DatabaseError) {
                internalMessage = "Database failure during site creation";
                console.error("[CreateSite] Database error during create", {
                    siteId: err.siteId,                    // or name/timezone if useful
                    operation: err.operation,
                    originalError: err.cause ?? err,    // ← the real sqlite/D1 error
                    stack: err.stack,
                });

            } else {
                console.error("[CreateSite] Unexpected error during create", err);
            }

            return {
                success: false,
                error: {
                    kind: "internal",
                    message: internalMessage,
                },
            };
        }

    }
}

