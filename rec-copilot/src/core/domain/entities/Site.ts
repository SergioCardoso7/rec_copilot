export interface Site {
    site_id: string;
    name: string;
    timezone: string;
    active_constraints_json: string | null;
}