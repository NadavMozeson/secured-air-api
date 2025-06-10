import fs from 'fs';
import path from 'path';

export interface Route {
  airline: string;
  airlineId: string;
  sourceAirport: string;
  sourceAirportId: string;
  destinationAirport: string;
  destinationAirportId: string;
  codeshare: string;
  stops: string;
  equipment: string;
}

export interface RouteWithCountries extends Route {
  sourceCountry: string;
  destinationCountry: string;
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ELITE = 'elite',
}

export interface TierConfiguration {
  countries: string[] | null;
}

export class RoutesService {
  private routes: Route[] = [];
  private airportCountryMap: Map<string, string> = new Map();
  private tierConfigurations: Record<SubscriptionTier, TierConfiguration> = {
    [SubscriptionTier.FREE]: {
      countries: ['Israel'],
    },
    [SubscriptionTier.PRO]: {
      countries: [
        'Israel',
        'United States',
        'Canada',
        'United Kingdom',
        'Germany',
        'France',
        'Australia',
        'Japan',
        'Brazil',
        'China',
        'India',
      ],
    },
    [SubscriptionTier.ELITE]: {
      countries: null,
    },
  };

  constructor() {
    this.loadAirportCountryMap();
    this.loadRoutes();
  }

  private loadAirportCountryMap(): void {
    try {
      const csvPath = path.join(__dirname, '../data/airports.csv');
      const csvData = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvData.split('\n');

      const dataLines = lines.slice(1);

      dataLines.forEach((line) => {
        if (line.trim()) {
          const fields = line.split(',');
          if (fields.length >= 4) {
            const iata = fields[3]?.trim();
            const country = fields[2]?.trim();
            if (iata && country && iata !== '\\N' && iata !== '') {
              this.airportCountryMap.set(iata, country);
            }
          }
        }
      });

      console.log(
        `Loaded ${this.airportCountryMap.size} airport-country mappings`
      );
    } catch (error) {
      console.error('Error loading airport-country mappings:', error);
    }
  }

  private loadRoutes(): void {
    try {
      const csvPath = path.join(__dirname, '../data/routes.csv');
      const csvData = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvData.split('\n');

      // Skip header row
      const dataLines = lines.slice(1);

      this.routes = dataLines
        .filter((line) => line.trim())
        .map((line) => this.parseCsvLine(line))
        .filter((route) => route !== null) as Route[];

      console.log(`Loaded ${this.routes.length} routes from CSV`);
    } catch (error) {
      console.error('Error loading routes data:', error);
      this.routes = [];
    }
  }

  private parseCsvLine(line: string): Route | null {
    try {
      const fields = line.split(',');

      if (fields.length < 9) {
        return null;
      }

      return {
        airline: fields[0]?.trim() || '',
        airlineId: fields[1]?.trim() || '',
        sourceAirport: fields[2]?.trim() || '',
        sourceAirportId: fields[3]?.trim() || '',
        destinationAirport: fields[4]?.trim() || '',
        destinationAirportId: fields[5]?.trim() || '',
        codeshare: fields[6]?.trim() || '',
        stops: fields[7]?.trim() || '',
        equipment: fields[8]?.trim() || '',
      };
    } catch (error) {
      console.error('Error parsing CSV line:', line, error);
      return null;
    }
  }

  private getRouteWithCountries(route: Route): RouteWithCountries {
    const sourceCountry =
      this.airportCountryMap.get(route.sourceAirport) || 'Unknown';
    const destinationCountry =
      this.airportCountryMap.get(route.destinationAirport) || 'Unknown';

    return {
      ...route,
      sourceCountry,
      destinationCountry,
    };
  }

  public getRoutesByTier(
    tier: SubscriptionTier
  ): Record<string, RouteWithCountries[]> {
    const config = this.tierConfigurations[tier];

    if (!config) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    const routesWithCountries = this.routes.map((route) =>
      this.getRouteWithCountries(route)
    );

    if (config.countries === null) {
      return this.groupRoutesBySourceCountry(routesWithCountries);
    }

    const filteredRoutes = routesWithCountries.filter(
      (route) =>
        config.countries!.includes(route.sourceCountry) ||
        config.countries!.includes(route.destinationCountry)
    );

    return this.groupRoutesBySourceCountry(filteredRoutes);
  }

  public getRoutesByCountry(
    tier: SubscriptionTier,
    country: string
  ): RouteWithCountries[] {
    const config = this.tierConfigurations[tier];

    if (!config) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    if (config.countries !== null && !config.countries.includes(country)) {
      throw new Error(
        `Country '${country}' is not accessible with ${tier} tier`
      );
    }

    const routesWithCountries = this.routes.map((route) =>
      this.getRouteWithCountries(route)
    );

    return routesWithCountries.filter(
      (route) =>
        route.sourceCountry === country || route.destinationCountry === country
    );
  }

  public getRoutesBetweenCountries(
    tier: SubscriptionTier,
    sourceCountry: string,
    destinationCountry: string
  ): RouteWithCountries[] {
    const config = this.tierConfigurations[tier];

    if (!config) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    if (config.countries !== null) {
      if (
        !config.countries.includes(sourceCountry) ||
        !config.countries.includes(destinationCountry)
      ) {
        throw new Error(
          `Access to routes between '${sourceCountry}' and '${destinationCountry}' requires a higher subscription tier`
        );
      }
    }

    const routesWithCountries = this.routes.map((route) =>
      this.getRouteWithCountries(route)
    );

    return routesWithCountries.filter(
      (route) =>
        route.sourceCountry === sourceCountry &&
        route.destinationCountry === destinationCountry
    );
  }

  public getAccessibleCountries(tier: SubscriptionTier): string[] {
    const config = this.tierConfigurations[tier];

    if (!config) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    if (config.countries === null) {
      const routesWithCountries = this.routes.map((route) =>
        this.getRouteWithCountries(route)
      );
      const allCountries = new Set<string>();

      routesWithCountries.forEach((route) => {
        if (route.sourceCountry !== 'Unknown')
          allCountries.add(route.sourceCountry);
        if (route.destinationCountry !== 'Unknown')
          allCountries.add(route.destinationCountry);
      });

      return [...allCountries].sort();
    }

    return config.countries;
  }

  public getTierStatistics(tier: SubscriptionTier): {
    totalRoutes: number;
    totalCountries: number;
    countriesWithData: string[];
  } {
    const routesByCountry = this.getRoutesByTier(tier);
    const countries = Object.keys(routesByCountry);

    return {
      totalRoutes: Object.values(routesByCountry).flat().length,
      totalCountries: countries.length,
      countriesWithData: countries.sort(),
    };
  }

  private groupRoutesBySourceCountry(
    routes: RouteWithCountries[]
  ): Record<string, RouteWithCountries[]> {
    return routes.reduce(
      (acc, route) => {
        if (!route.sourceCountry || route.sourceCountry === 'Unknown')
          return acc;

        if (!acc[route.sourceCountry]) {
          acc[route.sourceCountry] = [];
        }
        acc[route.sourceCountry].push(route);
        return acc;
      },
      {} as Record<string, RouteWithCountries[]>
    );
  }

  public hasCountryAccess(tier: SubscriptionTier, country: string): boolean {
    const config = this.tierConfigurations[tier];

    if (!config) {
      return false;
    }

    if (config.countries === null) {
      return true;
    }

    return config.countries.includes(country);
  }
}

export const routesService = new RoutesService();
