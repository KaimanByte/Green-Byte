import request from 'supertest';

type LoginResponse = {
  access_token: string;
  user: { id: number; email: string; role: 'admin' | 'operator' };
};

type SettingsResponse = {
  cpuMaxWatts: number;
  limits: { cpuMaxWatts: { min: number; max: number } };
};

type AuditLog = {
  action: string;
  changes: Array<{ field: string; from: unknown; to: unknown }>;
};

/**
 * E2E de HTTP real: aponta para um backend já iniciado com banco e migrations.
 * Não sobe AppModule dentro do Jest porque isso não valida autenticação, guards,
 * persistência e auditoria juntos. Veja o README para as variáveis E2E_*.
 */
describe('Fluxo administrativo HTTP (e2e)', () => {
  const baseUrl = process.env.E2E_BASE_URL?.trim().replace(/\/+$/, '');
  const adminEmail = (process.env.E2E_ADMIN_EMAIL ?? process.env.ADM_EMAIL)?.trim();
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? process.env.ADM_PASSWORD;
  const api = baseUrl ? request(baseUrl) : null;
  let token = '';
  let originalCpuMaxWatts: number | null = null;

  beforeAll(() => {
    if (!baseUrl || !adminEmail || !adminPassword) {
      throw new Error(
        'E2E_BASE_URL e credenciais E2E_ADMIN_* (ou ADM_* no ambiente Docker) são obrigatórias para o E2E HTTP real.',
      );
    }
  });

  async function login(email: string, password: string): Promise<LoginResponse> {
    const response = await api!.post('/auth/login').send({ email, password }).expect(200);
    return response.body as LoginResponse;
  }

  it('protege rotas, autentica, altera configuração e registra auditoria', async () => {
    await api!.get('/settings').expect(401);
    await api!.get('/audit-logs').expect(401);
    await api!.post('/auth/login').send({ email: adminEmail, password: `${adminPassword}-incorreta` }).expect(401);

    const session = await login(adminEmail!, adminPassword!);
    expect(session.user).toMatchObject({ email: adminEmail, role: 'admin' });
    token = session.access_token;

    // A rota exclusiva de administração também confirma que o papel no JWT é admin.
    await api!.get('/users').set('Authorization', `Bearer ${token}`).expect(200);

    const settingsResponse = await api!.get('/settings').set('Authorization', `Bearer ${token}`).expect(200);
    const settings = settingsResponse.body as SettingsResponse;
    originalCpuMaxWatts = settings.cpuMaxWatts;
    const { min, max } = settings.limits.cpuMaxWatts;
    const changedCpuMaxWatts = originalCpuMaxWatts < max ? originalCpuMaxWatts + 1 : originalCpuMaxWatts - 1;
    expect(changedCpuMaxWatts).toBeGreaterThanOrEqual(min);

    try {
      await api!
        .patch('/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ cpuMaxWatts: changedCpuMaxWatts })
        .expect(200);

      const auditResponse = await api!
        .get('/audit-logs?limit=20')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const auditLogs = auditResponse.body as AuditLog[];
      expect(
        auditLogs.some(
          (log) =>
            log.action === 'settings.update' &&
            log.changes.some(
              (change) =>
                change.field === 'cpuMaxWatts' && change.from === originalCpuMaxWatts && change.to === changedCpuMaxWatts,
            ),
        ),
      ).toBe(true);
    } finally {
      // A trilha permanece como evidência, mas o modelo de energia é restaurado.
      if (originalCpuMaxWatts !== null) {
        await api!
          .patch('/settings')
          .set('Authorization', `Bearer ${token}`)
          .send({ cpuMaxWatts: originalCpuMaxWatts })
          .expect(200);
      }
    }
  });
});
