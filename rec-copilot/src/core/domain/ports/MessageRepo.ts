import { Message } from "../entities/Message";

export interface MessageRepo {
    append(message: Message): Promise<Message>;
    listRecent(site_id: string, limit: number): Promise<Message[]>;
    getBySiteId(site_id: string): Promise<Message[]>;
}