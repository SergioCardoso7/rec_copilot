import { Context } from "hono";

export async function handleWebSocketUpgrade(c: Context<{ Bindings: Env }>): Promise<Response> {
    const siteId = c.req.param("site_id");

    if (!siteId || siteId.trim().length === 0) {
        return c.json({ error: "Missing site_id" }, 400);
    }

    const id = c.env.SITE_DO.idFromName(siteId);
    const stub = c.env.SITE_DO.get(id);
    return stub.fetch(c.req.raw);
}

export async function handleGetHistory(c: Context<{ Bindings: Env }>): Promise<Response> {
    const siteId = c.req.param("site_id");

    if (!siteId || siteId.trim().length === 0) {
        return c.json({ error: "Missing site_id" }, 400);
    }

    try {
        const id = c.env.SITE_DO.idFromName(siteId);
        const stub = c.env.SITE_DO.get(id);
        const url = new URL(c.req.url);
        url.pathname = `/sites/${siteId}/history`;

        return stub.fetch(new Request(url.toString(), c.req.raw));

    } catch (error) {
        console.error(`Failed to fetch history for site ${siteId}:`, error);
        return c.json(
            {
                error: "Failed to fetch message history",
                details: error instanceof Error ? error.message : undefined,
            },
            500
        );
    }
}

export async function handleGetDoState(
    c: Context<{ Bindings: Env }>
): Promise<Response> {
    const siteId = c.req.param("site_id");

    if (!siteId || siteId.trim().length === 0) {
        return c.json({ error: "Missing site_id" }, 400);
    }

    try {
        const id = c.env.SITE_DO.idFromName(siteId);
        const stub = c.env.SITE_DO.get(id);

        const url = new URL(c.req.url);
        url.pathname = `/sites/${siteId}/state`;

        return stub.fetch(new Request(url.toString(), c.req.raw));
    } catch (error) {
        console.error(`Failed to fetch DO state for site ${siteId}:`, error);
        return c.json(
            {
                error: "Failed to fetch site state",
                details: error instanceof Error ? error.message : undefined,
            },
            500
        );
    }
}