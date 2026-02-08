import { Context } from 'hono';
import { CreateSite } from "../../core/application/usecases/CreateSite";
import { D1SiteRepo } from "../../infrastructure/persistence/d1/D1SiteRepo";
import { z } from "zod";


const CreateSiteRequest = z.object({
  name: z.string().min(1, "Site name is required").trim(),
  timezone: z.string().min(1, "Timezone is required").trim(),
});


export async function handleCreateSite(c: Context<{ Bindings: Env }>) {

  try {
    const body = await c.req.json();

    if (!body) return jsonError("Invalid or missing JSON body", 400);

    const validatedData = CreateSiteRequest.parse(body);

    const repo = new D1SiteRepo(c.env.REC_COPILOT_DB);
    const usecase = new CreateSite(repo);
    const site = await usecase.execute(validatedData);

    return jsonSuccess(site, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(
        "Validation failed",
        400,
        error.issues.map(e => ({ field: e.path.join("."), message: e.message }))
      );
    }

    console.error("Error creating site:", error);
    if (error instanceof Error) {
      return jsonError(`Failed to create site: ${error.message}`, 500);
    }
    return jsonError(`Failed to create site: An unexpected error occurred`, 500);
  }
}

export async function handleGetSite(c: Context<{ Bindings: Env }>) {

  const site_id = c.req.param('site_id');

  try {
    const repo = new D1SiteRepo(c.env.REC_COPILOT_DB);
    const site = await repo.getById(site_id);
    if (!site) return jsonError(`Site not with id:${site_id} not found`, 404);

    return jsonSuccess(site, 200);

  } catch (error) {

    console.error(`Failed to fetch site: ${site_id}`, error);

    if (error instanceof Error) {
      return jsonError(`Failed to fetch site: ${site_id}, error: ${error.message}`, 500);
    }
    return jsonError(`Failed to fetch site: ${site_id}, an unexpected error occurred`, 500);
  }

}

function jsonSuccess<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    },
  });
}

function jsonError(message: string, status: number, details?: unknown): Response {
  const error: { error: string; details?: unknown } = { error: message };
  if (details) error.details = details;
  return new Response(JSON.stringify(error), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}