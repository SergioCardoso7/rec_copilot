import { Site } from "../entities/Site";

export interface SiteRepo {
    create(site: Site): Promise<Site>;
    getById(site_id: string): Promise<Site | null>;
}