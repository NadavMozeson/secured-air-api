import fs from 'fs';
import path from 'path';

export interface Airport {
  name: string;
  city: string;
  country: string;
  iata: string;
  icao: string;
  latitude: string;
  longitude: string;
  altitude: string;
  timezone: string;
  dst: string;
  timezoneDb: string;
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ELITE = 'elite',
}

export interface TierConfiguration {
  countries: string[] | null;
}

export class AirportsService {
  private airports: Airport[] = [];
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
    this.loadAirports();
  }

  private loadAirports(): void {
    try {
      const csvPath = path.join(__dirname, '../data/airports.csv');
      const csvData = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvData.split('\n');

      const dataLines = lines.slice(1);

      this.airports = dataLines
        .filter((line) => line.trim())
        .map((line) => this.parseCsvLine(line))
        .filter((airport) => airport !== null) as Airport[];

      console.log(`Loaded ${this.airports.length} airports from CSV`);
    } catch (error) {
      console.error('Error loading airports data:', error);
      this.airports = [];
    }
  }

  private parseCsvLine(line: string): Airport | null {
    try {
      const fields = line.split(',');

      if (fields.length < 11) {
        return null;
      }

      return {
        name: fields[0]?.trim() || '',
        city: fields[1]?.trim() || '',
        country: fields[2]?.trim() || '',
        iata: fields[3]?.trim() || '',
        icao: fields[4]?.trim() || '',
        latitude: fields[5]?.trim() || '',
        longitude: fields[6]?.trim() || '',
        altitude: fields[7]?.trim() || '',
        timezone: fields[8]?.trim() || '',
        dst: fields[9]?.trim() || '',
        timezoneDb: fields[10]?.trim() || '',
      };
    } catch (error) {
      console.error('Error parsing CSV line:', line, error);
      return null;
    }
  }

  public getAirportsByTier(tier: SubscriptionTier): Record<string, Airport[]> {
    const config = this.tierConfigurations[tier];

    if (!config) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    if (config.countries === null) {
      return this.groupAirportsByCountry(this.airports);
    }

    const filteredAirports = this.airports.filter((airport) =>
      config.countries!.includes(airport.country)
    );

    return this.groupAirportsByCountry(filteredAirports);
  }

  public getAirportsByCountry(
    tier: SubscriptionTier,
    country: string
  ): Airport[] {
    const config = this.tierConfigurations[tier];

    if (!config) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    if (config.countries !== null && !config.countries.includes(country)) {
      throw new Error(
        `Country '${country}' is not accessible with ${tier} tier`
      );
    }

    return this.airports.filter((airport) => airport.country === country);
  }

  public getAccessibleCountries(tier: SubscriptionTier): string[] {
    const config = this.tierConfigurations[tier];

    if (!config) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    if (config.countries === null) {
      return [
        ...new Set(this.airports.map((airport) => airport.country)),
      ].sort();
    }

    return config.countries;
  }

  public getTierStatistics(tier: SubscriptionTier): {
    totalAirports: number;
    totalCountries: number;
    countriesWithData: string[];
  } {
    const airportsByCountry = this.getAirportsByTier(tier);
    const countries = Object.keys(airportsByCountry);

    return {
      totalAirports: Object.values(airportsByCountry).flat().length,
      totalCountries: countries.length,
      countriesWithData: countries.sort(),
    };
  }

  private groupAirportsByCountry(
    airports: Airport[]
  ): Record<string, Airport[]> {
    return airports.reduce(
      (acc, airport) => {
        if (!airport.country) return acc;

        if (!acc[airport.country]) {
          acc[airport.country] = [];
        }
        acc[airport.country].push(airport);
        return acc;
      },
      {} as Record<string, Airport[]>
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

export const airportsService = new AirportsService();
