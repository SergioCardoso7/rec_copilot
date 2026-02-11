import { Message } from "../../../core/domain/entities/Message";
import { MessageRepo } from "../../../core/domain/ports/MessageRepo";
import { DatabaseError } from "../errors/DatabaseError";


export class D1MessageRepo implements MessageRepo {
    constructor(private db: D1Database) { }

    async append(message: Message): Promise<Message> {
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
            INSERT INTO messages (
                msg_id, site_id, role, content, created_at
            ) VALUES (?, ?, ?, ?, ?)
            RETURNING msg_id, site_id, role, content, created_at
            `);

        try {
            const row = await stmt
                .bind(
                    message.msg_id,
                    message.site_id,
                    message.role,
                    message.content,
                    now
                )
                .first<Message>();

            if (!row) {
                throw new DatabaseError("append", message.msg_id);
            }

            return row;
        } catch (err) {
            console.error("[D1MessageRepo.append]", { messageId: message.msg_id, err });
            throw new DatabaseError("append", message.msg_id, err);
        }
    }

    async listRecent(site_id: string, limit: number): Promise<Message[]> {
        try {
            const { results } = await this.db.prepare(`
                SELECT msg_id, site_id, role, content, created_at
                FROM messages
                WHERE site_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                `)
                .bind(site_id, limit).all<Message>();

            return results ?? [];
        } catch (err) {
            console.error("[D1MessageRepo.listRecent]", { siteId: site_id, limit: limit, err });
            throw new DatabaseError("listRecent", site_id, err);
        }
    }

    async getBySiteId(site_id: string): Promise<Message[]> {
        try {
            const { results } = await this.db.prepare(`
                SELECT msg_id, site_id, role, content, created_at
                FROM messages
                WHERE site_id = ?
                ORDER BY created_at DESC
                `)
                .bind(site_id).all<Message>();

            return results ?? [];
        } catch (err) {
            console.error("[D1MessageRepo.getBySiteId]", { siteId: site_id, err });
            throw new DatabaseError("getBySiteId", site_id, err);
        }

    }


}