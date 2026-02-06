export class SiteDO {
    constructor(private state: DurableObjectState, private env: Env) {

    }

    async fetch(request: Request): Promise<Response> {
        return new Response(
            JSON.stringify({
                message: "Hello from SiteDO",
                id: this.state.id.toString(),
                timestamp: new Date().toISOString()
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

}