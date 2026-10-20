export type Region = {
  code: string;
  city: string;
  area: string;
  country: string;
  latitude: number;
  longitude: number;
  carbonIntensity: number;
  renewableShare: number;
  services: string[];
  labelSide?: 'left' | 'right';
};

//trocar pra chamada ao backend qnd tiver endpoint da regiao


export const REGIONS: Region[] = [
    {
        code: 'br-sudeste',
        city: 'Sao Paulo',
        area: 'Sudeste',
        country: 'Brazil',
        latitude: -23.5505,
        longitude: -46.6333,
        carbonIntensity: 85,
        renewableShare: 83,
        services : ['Billing API', 'Email Dispatcher'],
    },
    {
        code: 'us-east',
        city: 'Ashburn',
        area: 'Virginia',
        country: 'United States',
        latitude: 39.0438,
        longitude: -77.4874,
        carbonIntensity: 378,
        renewableShare: 26,
        services: ['Checkout Worker', 'Fraud Detector'],
    },
    {
        code: 'eu-west',
        city: 'Dublin',
        area: 'Leinster',
        country: 'Ireland',
        latitude: 53.3498,
        longitude: -6.2603,
        carbonIntensity: 295,
        renewableShare: 38,
        services: ['Recommendation AI'],
    },
    {
        code: 'ca-central',
        city: 'Toronto',
        area: 'Ontario',
        country: 'Canada',
        latitude: 43.6532,
        longitude: -79.3832,
        carbonIntensity: 40,
        renewableShare: 89,
        services: ['Inventory Sync', 'Reporting Batch'],
        labelSide: 'right',
    },
    {
        code: 'jp-east',
        city: 'Tokyo',
        area: 'Tokyo',
        country: 'Japan',
        latitude: 35.6762,
        longitude: 139.6503,
        carbonIntensity: 465,
        renewableShare: 22,
        services: ['Audit Stream'],
    },
]

export type CarbonLevel = {
    id: 'baixa' | 'media' | 'alta';
    label: string;
    icon: 'leaf' | 'cloud' | 'smog';
}

//faixas de limites, ajustar dps

export function getCarbonLevel(carbonIntensity: number): CarbonLevel {
    if (carbonIntensity < 100) {
        return { id: 'baixa', label: 'Baixa', icon: 'leaf' };
    } else if (carbonIntensity < 300) {
        return { id: 'media', label: 'Média', icon: 'cloud' };
    } else {
        return { id: 'alta', label: 'Alta', icon: 'smog' };
    }
}