import { SiteRepo } from "../../../core/domain/ports/SiteRepo";
import { Site } from "../../../core/domain/entities/Site";
import { DatabaseError } from "../errors/DatabaseError";

export class D1SiteRepo implements SiteRepo {
    constructor(private db: D1Database) { }

    async create(site: Site): Promise<Site> {

        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
            INSERT INTO sites (
                site_id, name, timezone, active_constraints_json, created_at
            ) VALUES (?, ?, ?, ?, ?)
            RETURNING site_id, name, timezone, active_constraints_json, created_at
        `);

        try {
            const row = await stmt
                .bind(
                    site.site_id,
                    site.name,
                    site.timezone,
                    site.active_constraints_json ?? null,
                    now
                )
                .first<Site>();

            if (!row) {
                throw new DatabaseError("create", site.site_id);
            }

            return row;
        } catch (err) {
            console.error("[D1SiteRepo.create]", { siteId: site.site_id, err });

            throw new DatabaseError("create", site.site_id, err);
        }

    }

    async getById(site_id: string): Promise<Site | null> {
        try {

            const res = await this.db
                .prepare(
                    `SELECT site_id, name, timezone, active_constraints_json, created_at
                    FROM sites WHERE site_id = ?`
                )
                .bind(site_id)
                .first<Site>();

            return res ?? null;

        } catch (err) {
            console.error("[D1SiteRepo.getById]", { siteId: site_id, err });
            throw new DatabaseError("getById", site_id, err);
        }
    }
}