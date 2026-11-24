import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import request from 'supertest';

const testDir = mkdtempSync(path.join(tmpdir(), 'ruleta-test-'));
process.env.DB_PATH = path.join(testDir, 'test.db');
process.env.JWT_SECRET = 'test-secret';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.SPIN_RATE_LIMIT = '100000';

const { db, migrate } = await import('../src/config/db.js');
const { ensureDefaultSettings, setSetting } = await import('../src/common/settings.js');
const { createApp } = await import('../src/app.js');

const app = createApp();
let adminCookie = '';

function insertPrize(
  name: string,
  probability: number,
  quantity: number,
  isUnlimited: number,
  isConsolation: number,
  position: number,
): void {
  db.prepare(`
    INSERT INTO prizes (
      name, description, icon, color, probability, quantity, is_unlimited, delivered,
      active, is_consolation, position, result_title, result_message, whatsapp_button_text
    ) VALUES (?, '', '🎁', '#a855f7', ?, ?, ?, 0, 1, ?, ?, '', 'Premio de prueba', 'RECLAMAR')
  `).run(name, probability, quantity, isUnlimited, isConsolation, position);
}

function resetPrizes(): void {
  db.exec('DELETE FROM participations');
  db.exec('DELETE FROM prizes');
  setSetting('promotion', {
    enabled: true,
    startsAt: '',
    endsAt: '',
    maxPerPhone: 100_000,
    cooldownMinutes: 0,
    finishedMessage: 'Terminó',
  });
}

async function spin(phone: string, name = 'Probador') {
  return request(app)
    .post('/api/spin')
    .send({ name, phone, acceptedTerms: true });
}

before(async () => {
  migrate();
  ensureDefaultSettings();
  const hash = await import('bcryptjs');
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(
    'admin',
    await hash.default.hash('password123', 10),
  );
  const login = await request(app).post('/api/admin/login').send({ username: 'admin', password: 'password123' });
  assert.equal(login.status, 200);
  adminCookie = login.headers['set-cookie'][0].split(';')[0];
});

describe('Seguridad y configuración', () => {
  it('protege los endpoints administrativos', async () => {
    const response = await request(app).get('/api/admin/prizes');
    assert.equal(response.status, 401);
  });

  it('valida los datos de participación en el servidor', async () => {
    resetPrizes();
    insertPrize('Premio', 50, 10, 0, 0, 0);
    const response = await request(app)
      .post('/api/spin')
      .send({ name: 'A', phone: '123', acceptedTerms: false });
    assert.equal(response.status, 400);
  });

  it('respeta la vigencia y el estado de la promoción', async () => {
    resetPrizes();
    insertPrize('Premio', 100, 10, 0, 0, 0);
    const promotion = { enabled: false, startsAt: '', endsAt: '', maxPerPhone: 10, cooldownMinutes: 0, finishedMessage: 'Cerrada' };
    setSetting('promotion', promotion);
    const response = await spin('300111222');
    assert.equal(response.status, 403);
    assert.match(response.body.error.message, /desactivada/);
  });
});

describe('Motor de probabilidades e inventario', () => {
  it('nunca entrega más premios de los disponibles', async () => {
    resetPrizes();
    insertPrize('Cortesía', 5, 2, 0, 0, 0);
    insertPrize('Sigue participando', 95, 0, 1, 1, 1);

    for (let index = 0; index < 200; index += 1) {
      const response = await spin(`310000${String(index).padStart(4, '0')}`);
      assert.equal(response.status, 200, JSON.stringify(response.body));
    }

    const delivered = db.prepare("SELECT delivered FROM prizes WHERE name = 'Cortesía'").get() as { delivered: number };
    assert.equal(delivered.delivered, 2);
    const wins = db.prepare("SELECT COUNT(*) AS count FROM participations WHERE prize_name_snapshot = 'Cortesía'").get() as { count: number };
    assert.equal(wins.count, 2);
  });

  it('redistribuye probabilidades al agotarse una categoría', async () => {
    resetPrizes();
    insertPrize('Agotable', 100, 1, 0, 0, 0);
    insertPrize('Ilimitado', 1, 0, 1, 1, 1);

    const first = await spin('320111111');
    assert.equal(first.body.participation.prizeName, 'Agotable');
    assert.equal(first.body.winningIndex, 0);
    assert.equal(first.body.segments.length, 2);

    const second = await spin('320111222');
    assert.equal(second.status, 200);
    assert.equal(second.body.participation.prizeName, 'Ilimitado');
    assert.equal(second.body.winningIndex, 0);
    assert.equal(second.body.segments.length, 1);
    assert.equal(second.body.segments[0].name, 'Ilimitado');
  });

  it('el resultado visual coincide con el premio registrado', async () => {
    resetPrizes();
    insertPrize('A', 33, 0, 1, 0, 0);
    insertPrize('B', 33, 0, 1, 0, 1);
    insertPrize('C', 34, 0, 1, 0, 2);
    for (let index = 0; index < 60; index += 1) {
      const response = await spin(`330000${String(index).padStart(4, '0')}`);
      const { winningIndex, segments, participation } = response.body;
      assert.equal(segments[winningIndex].name, participation.prizeName);
    }
  });

  it('genera códigos únicos con formato válido', async () => {
    resetPrizes();
    insertPrize('Premio', 100, 0, 1, 0, 0);
    const codes: string[] = [];
    for (let index = 0; index < 25; index += 1) {
      const response = await spin(`340000${String(index).padStart(4, '0')}`);
      codes.push(response.body.participation.code);
    }
    assert.equal(new Set(codes).size, codes.length);
    assert.match(codes[0], /^RULETA-\d{4}-[0-9A-F]{6}$/);
  });

  it('protege el último premio ante giros simultáneos', async () => {
    resetPrizes();
    insertPrize('Ultimo', 100_000, 1, 0, 0, 0);
    insertPrize('Consuelo', 1, 0, 1, 1, 1);

    const responses = await Promise.all(
      Array.from({ length: 40 }, (_, index) => spin(`350000${String(index).padStart(4, '0')}`)),
    );

    assert.ok(responses.every((response) => response.status === 200));
    const winners = responses.filter((response) => response.body.participation.prizeName === 'Ultimo');
    assert.equal(winners.length, 1, 'Solo un usuario debe ganar el último premio');
    const delivered = db.prepare("SELECT delivered FROM prizes WHERE name = 'Ultimo'").get() as { delivered: number };
    assert.equal(delivered.delivered, 1);
  });

  it('respeta el límite por número de WhatsApp', async () => {
    resetPrizes();
    insertPrize('Premio', 100, 0, 1, 0, 0);
    setSetting('promotion', {
      enabled: true, startsAt: '', endsAt: '', maxPerPhone: 2, cooldownMinutes: 0, finishedMessage: 'Fin',
    });
    assert.equal((await spin('360111111')).status, 200);
    assert.equal((await spin('360111111')).status, 200);
    assert.equal((await spin('360111111')).status, 429);
  });
});

describe('Códigos y historial', () => {
  it('valida y canjea un código una sola vez', async () => {
    resetPrizes();
    insertPrize('Premio', 100, 5, 0, 0, 0);
    const spun = await spin('370111111');
    const code = spun.body.participation.code;

    const found = await request(app)
      .post('/api/admin/codes/validate')
      .set('Cookie', adminCookie)
      .send({ code });
    assert.equal(found.status, 200);
    assert.equal(found.body.valid, true);

    const redeemed = await request(app)
      .post('/api/admin/codes/redeem')
      .set('Cookie', adminCookie)
      .send({ code });
    assert.equal(redeemed.status, 200);

    const again = await request(app)
      .post('/api/admin/codes/redeem')
      .set('Cookie', adminCookie)
      .send({ code });
    assert.equal(again.status, 409);
  });

  it('exporta el historial y muestra estadísticas', async () => {
    const csv = await request(app)
      .get('/api/admin/participations/export.csv')
      .set('Cookie', adminCookie);
    assert.equal(csv.status, 200);
    assert.match(csv.headers['content-type'], /text\/csv/);
    assert.match(csv.text, /Código/);

    const stats = await request(app).get('/api/admin/stats').set('Cookie', adminCookie);
    assert.equal(stats.status, 200);
    assert.ok(stats.body.total > 0);
  });

  it('impide eliminar premios con historial', async () => {
    const prizeId = (db.prepare("SELECT id FROM prizes WHERE name = 'Premio' LIMIT 1").get() as { id: number }).id;
    const response = await request(app)
      .delete(`/api/admin/prizes/${prizeId}`)
      .set('Cookie', adminCookie);
    assert.equal(response.status, 409);
  });
});
