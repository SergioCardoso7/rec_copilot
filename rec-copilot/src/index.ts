/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {

		const url = new URL(request.url);
		const method = request.method;
		const pathname = url.pathname;

		switch (`${method} ${pathname}`) {
			case 'GET /health':
				return new Response(
					JSON.stringify({
						status: 'ok',
						timestamp: new Date().toISOString()
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					}
				);

			case 'GET /db-test':
				const result = await env.REC_COPILOT_DB.prepare('SELECT 1 as test').first();
				return new Response(
					JSON.stringify({
						message: 'database connected',
						result
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					}
				);
			default:
				return new Response(
					JSON.stringify({
						error: 'Not Found'
					}),
					{
						status: 404,
						headers: { 'Content-Type': 'application/json' }
					}
				);
		}
	},
} satisfies ExportedHandler<Env>;
