import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";

type Params = {
    site_id?: string;
}


export class SiteWorkFlow extends WorkflowEntrypoint<Env, Params> {
    async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
        const result = await step.do("nothing_yet", async () => {
            return {
                ok: true,
                site_id: event.payload?.site_id ?? null,
                ran_at: new Date().toISOString(),
            };
        });

        return result;
    }
}