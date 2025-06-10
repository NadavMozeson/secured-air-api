import fs from 'fs';
import path from 'path';

export interface Airline {
  name: string;
  iata: string;
  icao: string;
  callsign: string;
  country: string;
  active: string;
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ELITE = 'elite',
}

export interface TierConfiguration {
  countries: string[] | null;
}

export class AirlinesService {
  private airlines: Airline[] = [];
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
    this.loadAirlines();
  }

  private loadAirlines(): void {
    try {
      const csvPath = path.join(__dirname, '../data/airlines.csv');
      const csvData = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvData.split('\n');

      const dataLines = lines.slice(1);

      this.airlines = dataLines
        .filter((line) => line.trim())
        .map((line) => this.parseCsvLine(line))
        .filter((airline) => airline !== null) as Airline[];

      console.log(`Loaded ${this.airlines.length} airlines from CSV`);
    } catch (error) {
      console.error('Error loading airlines data:', error);
      this.airlines = [];
    }
  }

  private parseCsvLine(line: string): Airline | null {
    try {
      const fields = line.split(',');

      if (fields.length < 6) {
        return null;
      }

      return {
        name: fields[0]?.trim() || '',
        iata: fields[1]?.trim() || '',
        icao: fields[2]?.trim() || '',
        callsign: fields[3]?.trim() || '',
        country: fields[4]?.trim() || '',
        active: fields[5]?.trim() || '',
      };
    } catch (error) {
      console.error('Error parsing CSV line:', line, error);
      return null;
    }
  }

  public getAirlinesByTier(tier: SubscriptionTier): Record<string, Airline[]> {
    const config = this.tierConfigurations[tier];

    if (!config) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    if (config.countries === null) {
      return this.groupAirlinesByCountry(this.airlines);
    }

    const filteredAirlines = this.airlines.filter((airline) =>
      config.countries!.includes(airline.country)
    );

    return this.groupAirlinesByCountry(filteredAirlines);
  }

  public getAirlinesByCountry(
    tier: SubscriptionTier,
    country: string
  ): Airline[] {
    const config = this.tierConfigurations[tier];

    if (!config) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    if (config.countries !== null && !config.countries.includes(country)) {
      throw new Error(
        `Country '${country}' is not accessible with ${tier} tier`
      );
    }

    return this.airlines.filter((airline) => airline.country === country);
  }

  public getAccessibleCountries(tier: SubscriptionTier): string[] {
    const config = this.tierConfigurations[tier];

    if (!config) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    if (config.countries === null) {
      return [
        ...new Set(this.airlines.map((airline) => airline.country)),
      ].sort();
    }

    return config.countries;
  }

  public getTierStatistics(tier: SubscriptionTier): {
    totalAirlines: number;
    totalCountries: number;
    countriesWithData: string[];
  } {
    const airlinesByCountry = this.getAirlinesByTier(tier);
    const countries = Object.keys(airlinesByCountry);

    return {
      totalAirlines: Object.values(airlinesByCountry).flat().length,
      totalCountries: countries.length,
      countriesWithData: countries.sort(),
    };
  }

  private groupAirlinesByCountry(
    airlines: Airline[]
  ): Record<string, Airline[]> {
    return airlines.reduce(
      (acc, airline) => {
        if (!airline.country) return acc;

        if (!acc[airline.country]) {
          acc[airline.country] = [];
        }
        acc[airline.country].push(airline);
        return acc;
      },
      {} as Record<string, Airline[]>
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

export const airlinesService = new AirlinesService();
