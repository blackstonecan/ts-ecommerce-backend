import { ICountryExtended } from "./location.types";

/**
 * Simple in-memory cache for location data
 * Since locations rarely change, we cache the entire hierarchy
 */
class LocationCache {
    private cache: ICountryExtended[] | null = null;
    private lastUpdated: number | null = null;
    private readonly TTL: number; // Time to live in milliseconds

    constructor(ttlMinutes: number = 60) {
        this.TTL = ttlMinutes * 60 * 1000;
    }

    /**
     * Get cached locations if available and not expired
     */
    get(): ICountryExtended[] | null {
        if (!this.cache || !this.lastUpdated) {
            return null;
        }

        const now = Date.now();
        const age = now - this.lastUpdated;

        if (age > this.TTL) {
            this.clear();
            return null;
        }

        return this.cache;
    }

    /**
     * Set cache with current data
     */
    set(data: ICountryExtended[]): void {
        this.cache = data;
        this.lastUpdated = Date.now();
    }

    /**
     * Clear cache (useful when locations are updated)
     */
    clear(): void {
        this.cache = null;
        this.lastUpdated = null;
    }

    /**
     * Check if cache is valid
     */
    isValid(): boolean {
        return this.get() !== null;
    }
}

// Export singleton instance with 60 minute TTL
export const locationCache = new LocationCache(60);
