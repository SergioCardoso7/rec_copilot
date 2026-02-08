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

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { handleCreateSite, handleGetSite } from './interfaces/http/sites.controller';

export { SiteWorkFlow } from "./infrastructure/orchestration/workflows/site_workflow";
export { SiteDO } from "./infrastructure/orchestration/durable-objects/SitesDO";

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use('*', cors({
	origin: '*',
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization'],
	maxAge: 86400,
}));

app.get('/health', (c) => {
	return c.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
	});
});

app.get('/db-test', async (c) => {
	try {
		const result = await c.env.REC_COPILOT_DB.prepare('SELECT 1 as test').first();
		return c.json({
			message: 'Database connected successfully',
			result,
		});
	} catch (error) {
		console.error('Database test failed', error);
		return c.json(
			{
				error: 'Database connection failed',
				details: error instanceof Error ? error.message : undefined,
			},
			500
		);
	}
});

app.post('/sites', handleCreateSite);
app.get('/sites/:site_id', handleGetSite);

app.post('/workflow/test', async (c) => {
	try {
		const instance = await c.env.SITE_WORKFLOW.create({
			params: { site_id: 'demo-site' },
		});

		return c.json(
			{
				message: 'Workflow created successfully',
				instanceId: instance.id,
			},
			201
		);
	} catch (error) {
		console.error('Workflow creation failed:', error);
		return c.json(
			{
				error: 'Failed to create workflow',
				details: error instanceof Error ? error.message : undefined,
			},
			500
		);
	}
});

app.get('/site-do/test', async (c) => {
	try {
		const id = c.env.SITE_DO.idFromName('test-site');
		const stub = c.env.SITE_DO.get(id);
		const response = await stub.fetch(c.req.raw);
		return response;
	} catch (error) {
		console.error('Durable Object test failed:', error);
		return c.json(
			{
				error: 'Failed to communicate with Durable Object',
				details: error instanceof Error ? error.message : undefined,
			},
			500
		);
	}
});

app.notFound((c) => {
	return c.json(
		{
			error: 'Not Found',
			path: c.req.path,
			method: c.req.method,
		},
		404
	);
});

/**
 * Global Error Handler
 */
app.onError((err, c) => {
	console.error('Unhandled error:', err);

	// Don't expose internal errors in production
	const isDev = c.env.ENVIRONMENT === 'development';

	return c.json(
		{
			error: 'Internal Server Error',
			...(isDev && { details: err.message, stack: err.stack }),
		},
		500
	);
});

export default app;
