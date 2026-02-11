import { D1MessageRepo } from "../../persistence/d1/D1MessageRepo";

type WSIncomingMessage = {
    type: "chat";
    content: string;
};

type WSOutgoingMessage = {
    type: "message" | "error" | "ack" | "history";
    role?: "user" | "assistant";
    content?: string;
    siteId?: string;
    msg_id?: string;
    timestamp?: string;
    messages?: unknown[];
};

export class SiteDO {

    private state: DurableObjectState;
    private env: Env;

    private sessions = new Set<WebSocket>();

    private lastActivity: string | null = null;

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.env = env;
        this.state.getWebSockets().forEach((ws) => this.sessions.add(ws));
    }

    async fetch(request: Request): Promise<Response> {

        const url = new URL(request.url);

        if (url.pathname.endsWith("/ws")) {
            return this.handleWebSocketUpgrade(request);
        }

        if (url.pathname.endsWith("/state")) {
            return this.handleState();
        }

        if (url.pathname.endsWith("/history")) {
            return this.handleHistory();
        }

        return this.json({ error: "Not Found" }, 404);
    }

    private handleWebSocketUpgrade(req: Request): Response {
        if (req.headers.get("Upgrade") !== "websocket") {
            return this.json({ error: "Expected Web Socket upgrade" }, 426);
        }

        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        this.state.acceptWebSocket(server);

        this.sessions.add(server);
        this.lastActivity = new Date().toISOString();

        server.send(
            JSON.stringify({
                type: "ack",
                content: "Connected to SiteDO",
                timestamp: new Date().toISOString(),
                siteId: this.state.id.toString(),
            } satisfies WSOutgoingMessage)
        );

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
        this.lastActivity = new Date().toISOString();

        let parsed: WSIncomingMessage;
        try {
            let text: string;
            if (message instanceof ArrayBuffer) {
                text = new TextDecoder().decode(message);
            } else {
                text = message;
            }
            parsed = JSON.parse(text);
        } catch {
            ws.send(JSON.stringify({
                type: "error",
                content: "Invalid JSON",
            } satisfies WSOutgoingMessage));
            return;
        }

        switch (parsed.type) {
            case "chat":
                await this.handleChatMessage(ws, parsed.content);
                break;

            default:
                ws.send(JSON.stringify({
                    type: "error",
                    content: `Unknown message type: ${(parsed as WSIncomingMessage).type}`,
                } satisfies WSOutgoingMessage));
        }
    }

    private async handleChatMessage(ws: WebSocket, content: string): Promise<void> {

        if (!content || content.trim().length === 0) {
            ws.send(JSON.stringify({
                type: "error",
                content: "Message content cannot be empty",
            } satisfies WSOutgoingMessage));
            return;
        }

        const siteId = this.state.id.toString();
        const repo = new D1MessageRepo(this.env.REC_COPILOT_DB);

        try {

            const userMsgId = crypto.randomUUID();
            const userTimestamp = new Date().toISOString();
            await repo.append({
                msg_id: userMsgId,
                site_id: siteId,
                role: "user",
                content: content.trim(),
            });

            // Reply generation (echo for now, later replaced with AI)
            const replyContent = `echo: ${content.trim()}`;
            const replyMsgId = crypto.randomUUID();
            const replyTimestamp = new Date().toISOString();

            await repo.append({
                msg_id: replyMsgId,
                site_id: siteId,
                role: "assistant",
                content: replyContent,
            });

            this.broadcast([
                {
                    type: "message",
                    role: "user",
                    content: content.trim(),
                    msg_id: userMsgId,
                    timestamp: userTimestamp,
                },
                {
                    type: "message",
                    role: "assistant",
                    content: replyContent,
                    msg_id: replyMsgId,
                    timestamp: replyTimestamp,
                },
            ]);
        } catch (error) {
            console.error("Failed to handle chat message:", error);
            ws.send(JSON.stringify({
                type: "error",
                content: "Failed to process message",
            } satisfies WSOutgoingMessage));
        }
    }

    private broadcast(messages: WSOutgoingMessage[]): void {
        const payload = JSON.stringify(messages.length === 1 ? messages[0] : messages);

        for (const session of this.sessions) {
            try {
                session.send(payload);
            } catch (error) {
                console.warn("Removing stale WebSocket connection");
                this.sessions.delete(session);
            }
        }
    }

    private handleState(): Response {
        return this.json({
            siteId: this.state.id.toString(),
            activeConnections: this.sessions.size,
            lastActivity: this.lastActivity,
        });
    }

    private async handleHistory(): Promise<Response> {
        try {
            const repo = new D1MessageRepo(this.env.REC_COPILOT_DB);
            const messages = await repo.getBySiteId(this.state.id.toString());
            return this.json({ messages });
        } catch (error) {
            console.error("Failed to fetch history:", error);
            return this.json({ error: "Failed to fetch message history" }, 500);
        }
    }


    webSocketClose(ws: WebSocket, code: number, reason: string): void {
        this.sessions.delete(ws);
        console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}. Active sessions: ${this.sessions.size}`);
    }

    webSocketError(ws: WebSocket, error: unknown): void {
        this.sessions.delete(ws);
        console.error("WebSocket error:", error);
    }

    private json(data: unknown, status = 200): Response {
        return new Response(JSON.stringify(data), {
            status,
            headers: { "Content-Type": "application/json" },
        });
    }

}