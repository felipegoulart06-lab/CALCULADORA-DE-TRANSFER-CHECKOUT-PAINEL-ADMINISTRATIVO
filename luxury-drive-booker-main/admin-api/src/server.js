const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { supabase } = require('./supabase');

dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

const app = express();
// Inicializa Prisma somente se habilitado
const USE_PRISMA = process.env.USE_PRISMA === 'true';
let prisma = null;
if (USE_PRISMA) {
  const { PrismaClient, Prisma } = require('@prisma/client');
  prisma = new PrismaClient();
  global.Prisma = Prisma;
}
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const USE_MOCK_CHECKOUT = process.env.MOCK_CHECKOUT === 'true';
let MOCK_CAMPO_ID_SEQ = 6;
let MOCK_CHECKOUT_CAMPOS = [
  { id: 1, nome_campo: 'Nome completo', tipo: 'texto', obrigatorio: true, ordem: 1, ativo: true },
  { id: 2, nome_campo: 'E-mail', tipo: 'email', obrigatorio: true, ordem: 2, ativo: true },
  { id: 3, nome_campo: 'Telefone/WhatsApp', tipo: 'texto', obrigatorio: true, ordem: 3, ativo: true },
  { id: 4, nome_campo: 'CPF', tipo: 'texto', obrigatorio: true, ordem: 4, ativo: true },
  { id: 5, nome_campo: 'Número do voo', tipo: 'texto', obrigatorio: false, ordem: 5, ativo: true },
];
let MOCK_CHECKOUT_CONFIG = { acao_pos_envio: 'WEBHOOK', url_destino: '', metodo_http: 'POST' };

// Mocks de veículos para administração sem banco
const USE_MOCK_VEHICLES = process.env.MOCK_VEHICLES === 'true';
let MOCK_VEICULO_ID_SEQ = 4;
let MOCK_VEICULOS = [
  {
    id: 1,
    nome: 'Mercedes-Benz Classe E',
    marca: 'Mercedes-Benz',
    modelo: 'Classe E',
    ano: 2023,
    categoria: 'Sedan',
    cor: 'Preto Metálico',
    placa: 'LDR-1001',
    passageiros: 3,
    malas: 3,
    portas: 4,
    tracao: 'Traseira',
    combustivel: 'Gasolina',
    consumo_medio: 8.5,
    potencia_cv: 300,
    transmissao: 'Automática 9 marchas',
    ar_condicionado: true,
    wifi: true,
    agua: true,
    tomadas: true,
    outros_servicos: '',
    imagem_principal: '/placeholder.svg',
    galeria_imagens: [],
    video_url: '',
    tarifa_base: 250,
    preco_km: 6,
    preco_minuto: 0,
    descricao_curta: 'Sedan executivo de luxo com conforto excepcional.',
    descricao_detalhada: '',
    ultima_revisao: '',
    proxima_revisao: '',
    kilometragem_atual: 0,
    seguro_valido_ate: '',
    status: 'ATIVO',
  },
  {
    id: 2,
    nome: 'BMW X5',
    marca: 'BMW',
    modelo: 'X5',
    ano: 2022,
    categoria: 'SUV',
    cor: 'Preto',
    placa: 'LDR-2002',
    passageiros: 4,
    malas: 6,
    portas: 5,
    tracao: '4x4',
    combustivel: 'Gasolina',
    consumo_medio: 7.8,
    potencia_cv: 340,
    transmissao: 'Automática 8 marchas',
    ar_condicionado: true,
    wifi: true,
    agua: true,
    tomadas: true,
    outros_servicos: '',
    imagem_principal: '/placeholder.svg',
    galeria_imagens: [],
    video_url: '',
    tarifa_base: 300,
    preco_km: 7,
    preco_minuto: 0,
    descricao_curta: 'SUV premium com amplo espaço e tecnologia.',
    descricao_detalhada: '',
    ultima_revisao: '',
    proxima_revisao: '',
    kilometragem_atual: 0,
    seguro_valido_ate: '',
    status: 'ATIVO',
  },
  {
    id: 3,
    nome: 'Mercedes-Benz Sprinter',
    marca: 'Mercedes-Benz',
    modelo: 'Sprinter',
    ano: 2021,
    categoria: 'Van',
    cor: 'Prata',
    placa: 'LDR-3003',
    passageiros: 12,
    malas: 12,
    portas: 4,
    tracao: 'Traseira',
    combustivel: 'Diesel',
    consumo_medio: 9.5,
    potencia_cv: 190,
    transmissao: 'Automática',
    ar_condicionado: true,
    wifi: true,
    agua: true,
    tomadas: true,
    outros_servicos: '',
    imagem_principal: '/placeholder.svg',
    galeria_imagens: [],
    video_url: '',
    tarifa_base: 450,
    preco_km: 9,
    preco_minuto: 0,
    descricao_curta: 'Van executiva para grupos e bagagens volumosas.',
    descricao_detalhada: '',
    ultima_revisao: '',
    proxima_revisao: '',
    kilometragem_atual: 0,
    seguro_valido_ate: '',
    status: 'ATIVO',
  },
];
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Helpers para Storage do Supabase
const ADMIN_BUCKET = 'admin-config';
async function ensureBucket() {
  try {
    const { data: bucket } = await supabase.storage.getBucket(ADMIN_BUCKET);
    if (!bucket) await supabase.storage.createBucket(ADMIN_BUCKET, { public: false });
  } catch (e) {
    // Ignorar se bucket já existir
  }
}
async function readJson(path, fallback) {
  try {
    const { data, error } = await supabase.storage.from(ADMIN_BUCKET).download(path);
    if (error || !data) return fallback;
    const text = await data.text();
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
async function writeJson(path, obj) {
  const body = JSON.stringify(obj);
  const { error } = await supabase.storage.from(ADMIN_BUCKET).upload(path, body, { contentType: 'application/json', upsert: true });
  if (error) throw new Error(error.message);
}

// Util: registrar logs de alterações
async function auditLog(usuarioId, descricao, entidade, entidadeId) {
  try {
    if (USE_PRISMA && prisma) {
      await prisma.tabela_logs.create({
        data: { usuario_id: usuarioId || null, descricao, entidade, entidade_id: entidadeId || null },
      });
    } else {
      console.log('[AUDIT]', { usuarioId, descricao, entidade, entidadeId });
    }
  } catch (e) {
    console.error('Falha ao registrar log:', e.message);
  }
}

// Seed: criar usuário admin se não existir (somente quando Prisma estiver ativo e login não-mock)
async function ensureSeedAdmin() {
  if (!USE_PRISMA || process.env.MOCK_LOGIN === 'true' || !prisma) return;
  const email = 'admin@luxurydrive.com';
  const existing = await prisma.tabela_usuarios_admin.findUnique({ where: { email } });
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.tabela_usuarios_admin.create({
      data: { nome: 'Administrador', email, senha_hash: hash, nivel_acesso: 'ADMIN' },
    });
    console.log('Usuário admin criado: admin@luxurydrive.com / admin123');
  }
}

// Middleware de autenticação
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.substring(7) : null;
  if (!token) return res.status(401).json({ message: 'Token ausente' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, nome, email, nivel }
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

// Auth: login com 2FA opcional
app.post('/auth/login', async (req, res) => {
  const { email, senha, totp } = req.body || {};
  if (!email || !senha) return res.status(400).json({ message: 'Informe email e senha' });

  // Modo mock
  if (process.env.MOCK_LOGIN === 'true') {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@luxurydrive.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrador';
    if (email === ADMIN_EMAIL && senha === ADMIN_PASSWORD) {
      try {
        const cfg = await readJson('settings.json', null);
        if (cfg?.twofa_enabled) {
          if (!cfg.twofa_secret) return res.status(401).json({ message: '2FA configurado sem segredo' });
          const ok2fa = verifyTOTP(cfg.twofa_secret, totp);
          if (!ok2fa) return res.status(401).json({ message: 'Código 2FA inválido' });
        }
      } catch (e) {
        console.warn('Verificação 2FA falhou:', e?.message || e);
      }
      const mockUser = { id: 1, nome: ADMIN_NAME, email: ADMIN_EMAIL, nivel_acesso: 'ADMIN' };
      const token = jwt.sign({ id: mockUser.id, nome: mockUser.nome, email: mockUser.email, nivel: mockUser.nivel_acesso }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ token, user: { id: mockUser.id, nome: mockUser.nome, email: mockUser.email, nivel: mockUser.nivel_acesso } });
    }
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  if (!USE_PRISMA || !prisma) {
    return res.status(503).json({ message: 'Login não disponível (Prisma desativado). Ative MOCK_LOGIN=true.' });
  }

  try {
    const user = await prisma.tabela_usuarios_admin.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });

    // Enforce 2FA se habilitado
    try {
      const cfg = await readJson('settings.json', null);
      if (cfg?.twofa_enabled) {
        if (!cfg.twofa_secret) return res.status(401).json({ message: '2FA configurado sem segredo' });
        const ok2fa = verifyTOTP(cfg.twofa_secret, totp);
        if (!ok2fa) return res.status(401).json({ message: 'Código 2FA inválido' });
      }
    } catch (e) {
      console.warn('Verificação 2FA falhou:', e?.message || e);
    }

    await prisma.tabela_usuarios_admin.update({ where: { id: user.id }, data: { ultimo_login: new Date() } });
    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email, nivel: user.nivel_acesso }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, nivel: user.nivel_acesso } });
  } catch (e) {
    console.error('Login falhou (DB indisponível):', e.message);
    return res.status(503).json({ message: 'Banco indisponível' });
  }
});

// TOTP helpers
function base32ToBuffer(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = String(base32 || '').replace(/=+$/,'').toUpperCase().replace(/[^A-Z2-7]/g,'');
  let bits = '';
  for (const c of cleaned) {
    const val = alphabet.indexOf(c);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTOTP(secret, timeStep = 30, counter = Math.floor(Date.now() / 1000 / timeStep)) {
  const key = base32ToBuffer(secret);
  const buf = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    buf[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[19] & 0x0f;
  const codeInt = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  const code = (codeInt % 1000000).toString().padStart(6, '0');
  return code;
}

function verifyTOTP(secret, code, window = 1, timeStep = 30) {
  try {
    const target = String(code || '').trim();
    if (!target || target.length !== 6) return false;
    const nowCounter = Math.floor(Date.now() / 1000 / timeStep);
    for (let i = -window; i <= window; i++) {
      if (generateTOTP(secret, timeStep, nowCounter + i) === target) return true;
    }
    return false;
  } catch {
    return false;
  }
}
// ... existing code ...

// Configurações do Admin (tema, 2FA, shortcode)
app.get('/config/admin', authMiddleware, async (req, res) => {
  try {
    const def = {
      theme: 'light',
      twofa_enabled: false,
      twofa_secret: null,
      twofa_issuer: 'LuxuryDrive',
      twofa_account: req.user?.email || 'admin@luxurydrive.com',
      form_shortcode: null,
      cache_version: Date.now(),
    };
    const cfg = await readJson('settings.json', def);
    res.json(cfg || def);
  } catch (e) {
    console.error('Erro ao obter config admin:', e.message);
    res.status(503).json({ message: 'Supabase indisponível' });
  }
});

app.post('/config/admin', authMiddleware, async (req, res) => {
  try {
    const current = (await readJson('settings.json', null)) || {};
    const updated = { ...current, ...req.body };
    await writeJson('settings.json', updated);
    await auditLog(req.user?.id, 'Atualizou Configurações do Admin', 'admin_config', null);
    res.json(updated);
  } catch (e) {
    console.error('Erro ao salvar config admin:', e.message);
    res.status(503).json({ message: 'Supabase indisponível' });
  }
});

// Verificar código 2FA (protegido)
app.post('/auth/verify-2fa', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body || {};
    const cfg = await readJson('settings.json', null);
    if (!cfg || !cfg.twofa_secret) return res.status(400).json({ ok: false, message: 'Segredo não definido' });
    const valid = verifyTOTP(cfg.twofa_secret, code);
    if (!valid) return res.status(401).json({ ok: false, message: 'Código inválido' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Erro verify-2fa:', e.message);
    res.status(503).json({ ok: false, message: 'Supabase indisponível' });
  }
});

// Endpoint público somente para versão de cache

// Logs
app.get('/logs', authMiddleware, async (req, res) => {
  if (USE_PRISMA && prisma) {
    const items = await prisma.tabela_logs.findMany({ orderBy: { created_at: 'desc' }, take: 100 });
    res.json(items);
  } else {
    res.json([]);
  }
});

// Veículos (CRUD via Supabase Storage com fallback mock)
async function readVeiculos() {
  const items = await readJson('veiculos.json', USE_MOCK_VEHICLES ? MOCK_VEICULOS : []);
  return Array.isArray(items) ? items : [];
}
async function writeVeiculos(items) {
  await writeJson('veiculos.json', items);
}

// Listar veículos
app.get('/veiculos', authMiddleware, async (req, res) => {
  try {
    const items = await readVeiculos();
    res.json(items);
  } catch (e) {
    console.error('Erro ao carregar veículos:', e.message);
    res.status(503).json({ message: 'Supabase indisponível' });
  }
});

// Criar veículo
app.post('/veiculos', authMiddleware, async (req, res) => {
  try {
    const items = await readVeiculos();
    const body = req.body || {};
    const id = (items.reduce((max, x) => Math.max(max, Number(x.id || 0)), 0) || 0) + 1;
    const novo = { id, ...body };
    items.push(novo);
    await writeVeiculos(items);
    await auditLog(req.user?.id, `Criou veículo ${novo.nome}`, 'veiculo', id);
    res.json(novo);
  } catch (e) {
    console.error('Erro ao criar veículo:', e.message);
    res.status(503).json({ message: 'Supabase indisponível' });
  }
});

// Atualizar veículo
app.put('/veiculos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const items = await readVeiculos();
    const idx = items.findIndex((v) => Number(v.id) === id);
    if (idx < 0) return res.status(404).json({ message: 'Veículo não encontrado' });
    items[idx] = { ...items[idx], ...req.body, id };
    await writeVeiculos(items);
    await auditLog(req.user?.id, `Atualizou veículo ${items[idx].nome}`,'veiculo', id);
    res.json(items[idx]);
  } catch (e) {
    console.error('Erro ao atualizar veículo:', e.message);
    res.status(503).json({ message: 'Supabase indisponível' });
  }
});

// Excluir veículo
app.delete('/veiculos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const items = await readVeiculos();
    const idx = items.findIndex((v) => Number(v.id) === id);
    if (idx < 0) return res.status(404).json({ message: 'Veículo não encontrado' });
    const [removed] = items.splice(idx, 1);
    await writeVeiculos(items);
    await auditLog(req.user?.id, `Removeu veículo ${removed?.nome || id}`, 'veiculo', id);
    res.json({ ok: true });
  } catch (e) {
    console.error('Erro ao remover veículo:', e.message);
    res.status(503).json({ message: 'Supabase indisponível' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

async function ensureSeedVehicles() {
  try {
    const { count, error } = await supabase.from('vehicles').select('*', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    if (!count || count === 0) {
      const now = new Date().toISOString();
      const seed = [
        { name: 'Mercedes-Benz Classe E', category: 'Sedan', capacity_passengers: 3, capacity_luggage: 3, image_url: '/placeholder.svg', base_rate: 250, rate_per_km: 6, description: 'Sedan executivo de luxo com conforto excepcional.', is_available: true, display_order: 1, created_at: now, updated_at: now },
        { name: 'BMW X5', category: 'SUV', capacity_passengers: 4, capacity_luggage: 6, image_url: '/placeholder.svg', base_rate: 300, rate_per_km: 7, description: 'SUV premium com amplo espaço e tecnologia.', is_available: true, display_order: 2, created_at: now, updated_at: now },
        { name: 'Mercedes-Benz Sprinter', category: 'Van', capacity_passengers: 12, capacity_luggage: 12, image_url: '/placeholder.svg', base_rate: 450, rate_per_km: 9, description: 'Van executiva para grupos e bagagens volumosas.', is_available: true, display_order: 3, created_at: now, updated_at: now },
      ];
      const { error: insErr } = await supabase.from('vehicles').insert(seed);
      if (!insErr) console.log('Veículos padrão inseridos no Supabase (seed).');
      else console.warn('Seed veículos falhou:', insErr.message);
    }
  } catch (e) {
    console.error('Seed veículos falhou:', e.message);
  }
}

(async () => {
  try {
    await ensureBucket();
    await ensureSeedAdmin();
    await ensureSeedVehicles();
  } catch (e) {
    console.error('Seed inicial falhou:', e.message);
  }
  app.listen(PORT, () => console.log(`Admin API rodando em http://localhost:${PORT}`));
})();