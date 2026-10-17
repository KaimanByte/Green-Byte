import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001';

export function useGreenData() {
  const [data, setData] = useState({
    regions: [] as any[],
    services: [] as any[],
    emissions: [] as any[],
    serviceEmissions: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [regionsRes, servicesRes, emissionsRes, serviceEmissionsRes] = await Promise.all([
        fetch(`${API_URL}/regions`, { cache: 'no-store' }),
        fetch(`${API_URL}/services`, { cache: 'no-store' }),
        fetch(`${API_URL}/collections/emissions/region`, { cache: 'no-store' }),
        fetch(`${API_URL}/collections/emissions/service`, { cache: 'no-store' }),
      ]);

      setData({
        regions: await regionsRes.json(),
        services: await servicesRes.json(),
        emissions: await emissionsRes.json(),
        serviceEmissions: await serviceEmissionsRes.json(),
      });
      
      setLastSync(new Date());
    } catch (error) {
      console.error("Falha ao sincronizar com o backend:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Retorna todas as propriedades incluindo o lastSync tipado corretamente
  return { ...data, loading, refetch: fetchAllData, lastSync };
}