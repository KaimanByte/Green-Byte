export interface ServiceLocationDto {
  country: string;
  region: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

export class ServiceResponseDto {
  id: string;
  name: string;
  status: string;
  regionCode: string;
  location: ServiceLocationDto;
  metricsPath: string | null;
}