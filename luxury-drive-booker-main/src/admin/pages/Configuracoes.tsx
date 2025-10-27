import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type AdminConfig = {
  theme: 'light' | 'dark';
  twofa_enabled: boolean;
  twofa_secret: string | null;
  twofa_issuer: string;
  twofa_account: string;
  form_shortcode: string | null;
  cache_version: number;
  project_name?: string;
};

const DEFAULT_SHORTCODE = (origin: string) => `<iframe src="${origin}/checkout?embed=1" width="100%" height="900" frameborder="0"></iframe>`;

function randomBase32Secret(length = 32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const arr = new Uint8Array(length);
  if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(arr);
  return Array.from(arr).map(v => alphabet[v % alphabet.length]).join('');
}

export default function Configuracoes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState<AdminConfig>({
    theme: (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
    twofa_enabled: false,
    twofa_secret: null,
    twofa_issuer: 'LuxuryDrive',
    twofa_account: JSON.parse(localStorage.getItem('admin_user') || '{}')?.email || 'admin@luxurydrive.com',
    form_shortcode: null,
    cache_version: Date.now(),
    project_name: localStorage.getItem('lux-project-name') || 'Luxury Drive',
  });

  const token = localStorage.getItem('admin_token');
  const origin = window.location.origin;
  const [totpCode, setTotpCode] = useState('');

  const otpauthUri = useMemo(() => {
    if (!cfg.twofa_secret) return '';
    const label = `${encodeURIComponent(cfg.twofa_issuer)}:${encodeURIComponent(cfg.twofa_account)}`;
    const params = new URLSearchParams({
      secret: cfg.twofa_secret,
      issuer: cfg.twofa_issuer,
      period: '30',
      digits: '6',
      algorithm: 'SHA1',
    });
    return `otpauth://totp/${label}?${params.toString()}`;
  }, [cfg.twofa_secret, cfg.twofa_issuer, cfg.twofa_account]);

  const qrUrl = otpauthUri ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUri)}` : '';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/config/admin`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setCfg(prev => ({ ...prev, ...(data || {}) }));
          // aplica tema do servidor
          applyTheme((data?.theme as 'light'|'dark') || prevTheme());
          // sincroniza nome do projeto localmente, se existir no servidor
          if (data?.project_name) {
            localStorage.setItem('lux-project-name', data.project_name);
          }
        }
      } catch (e) {
        console.warn('Falha ao carregar configurações do admin:', e);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevTheme = (): 'light' | 'dark' => (localStorage.getItem('lux-theme') as 'light' | 'dark') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  const applyTheme = (next: 'light' | 'dark') => {
    if (next === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('lux-theme', next);
    setCfg(c => ({ ...c, theme: next }));
  };

  const save = async (patch: Partial<AdminConfig>, okMsg = 'Configurações salvas') => {
    if (!token) {
      toast({ title: 'Sem sessão', description: 'Faça login novamente', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/config/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...cfg, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Falha ao salvar');
      setCfg(prev => ({ ...prev, ...(data || {}) }));
      // se houver project_name nas alterações, persistir localmente também
      if (patch.project_name) {
        localStorage.setItem('lux-project-name', patch.project_name);
      }
      toast({ title: okMsg });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const verifyTotp = async () => {
    if (!token) {
      toast({ title: 'Sem sessão', description: 'Faça login novamente', variant: 'destructive' });
      return;
    }
    if (!totpCode) {
      toast({ title: 'Informe o código', description: 'Digite o código TOTP do app' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'Código inválido');
      toast({ title: 'Código válido', description: '2FA configurado corretamente.' });
    } catch (e: any) {
      toast({ title: 'Código inválido', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const clearLocalCache = () => {
    const preserve = ['admin_token', 'admin_user'];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    keys.forEach(k => { if (!preserve.includes(k)) localStorage.removeItem(k); });
    toast({ title: 'Cache limpo', description: 'Dados locais foram limpos (login mantido).' });
    window.location.reload();
  };

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden px-2 sm:px-4">
      <h1 className="text-xl font-semibold">Configurações</h1>
      <Tabs defaultValue="2fa" className="w-full">
        <TabsList className="flex flex-wrap gap-2 w-full">
          <TabsTrigger value="2fa">Autenticação 2FA</TabsTrigger>
          <TabsTrigger value="tema">Tema</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="shortcode">Shortcode</TabsTrigger>
        </TabsList>

        {/* 2FA */}
        <TabsContent value="2fa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
              <CardDescription>Ative 2FA com aplicativo Authenticator via QR Code.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Issuer</Label>
                  <Input value={cfg.twofa_issuer} onChange={e => setCfg({ ...cfg, twofa_issuer: e.target.value })} />
                </div>
                <div>
                  <Label>Conta (email ou usuário)</Label>
                  <Input value={cfg.twofa_account} onChange={e => setCfg({ ...cfg, twofa_account: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" onClick={() => setCfg(c => ({ ...c, twofa_secret: randomBase32Secret() }))}>
                  Gerar novo segredo
                </Button>
                <Button variant="secondary" type="button" onClick={() => save({ twofa_secret: cfg.twofa_secret, twofa_issuer: cfg.twofa_issuer, twofa_account: cfg.twofa_account, twofa_enabled: true }, '2FA ativado')}>
                  Ativar 2FA
                </Button>
                <Button variant="outline" type="button" onClick={() => save({ twofa_enabled: false }, '2FA desativado')}>
                  Desativar 2FA
                </Button>
              </div>

              {cfg.twofa_secret && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>QR Code</Label>
                    <div className="p-3 border rounded bg-white dark:bg-neutral-800 inline-block">
                      {qrUrl ? <img src={qrUrl} alt="QR 2FA" className="h-48 w-48" /> : <div className="text-sm">Gere um segredo para exibir o QR.</div>}
                    </div>
                  </div>
                  <div>
                    <Label>URI (otpauth)</Label>
                    <Input readOnly value={otpauthUri} />
                    <div className="mt-2 flex gap-2">
                      <Button type="button" onClick={() => { navigator.clipboard.writeText(otpauthUri); toast({ title: 'Copiado URI 2FA' }); }}>Copiar</Button>
                      <Button type="button" onClick={() => save({ twofa_secret: cfg.twofa_secret }, 'Segredo 2FA salvo')}>Salvar segredo</Button>
                    </div>
                  </div>
                  <div>
                    <Label>Teste de código TOTP</Label>
                    <div className="flex items-center gap-2">
                      <Input placeholder="000000" value={totpCode} onChange={e => setTotpCode(e.target.value)} />
                      <Button type="button" onClick={verifyTotp}>Testar código</Button>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">Valide com seu app Authenticator antes de ativar.</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tema */}
        <TabsContent value="tema" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tema do Painel</CardTitle>
              <CardDescription>Alternar entre modo claro e escuro e salvar preferência.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant={cfg.theme === 'light' ? 'default' : 'outline'} onClick={() => { applyTheme('light'); save({ theme: 'light' }, 'Tema claro aplicado'); }}>Claro</Button>
                <Button variant={cfg.theme === 'dark' ? 'default' : 'outline'} onClick={() => { applyTheme('dark'); save({ theme: 'dark' }, 'Tema escuro aplicado'); }}>Escuro</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <Label>Nome do projeto</Label>
                  <Input value={cfg.project_name || ''} onChange={e => setCfg({ ...cfg, project_name: e.target.value })} placeholder="Luxury Drive" />
                </div>
                <div className="flex items-end">
                  <Button onClick={() => save({ project_name: (cfg.project_name || 'Luxury Drive') }, 'Nome do projeto atualizado')}>Salvar nome</Button>
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Preferência é persistida em localStorage e no servidor.</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache */}
        <TabsContent value="cache" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache</CardTitle>
              <CardDescription>Limpar dados locais e atualizar a versão de cache.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={clearLocalCache}>Limpar cache local</Button>
                <Button variant="secondary" onClick={() => save({ cache_version: Date.now() }, 'Versão de cache atualizada')}>Atualizar versão de cache</Button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Ao limpar cache, o login é mantido.</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shortcode */}
        <TabsContent value="shortcode" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Shortcode do Formulário</CardTitle>
              <CardDescription>Copie e use em qualquer site externo (iframe).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Snippet para embed</Label>
              <Input value={cfg.form_shortcode || DEFAULT_SHORTCODE(origin)} onChange={e => setCfg({ ...cfg, form_shortcode: e.target.value })} />
              <div className="flex items-center gap-2">
                <Button onClick={() => { navigator.clipboard.writeText(cfg.form_shortcode || DEFAULT_SHORTCODE(origin)); toast({ title: 'Shortcode copiado' }); }}>Copiar</Button>
                <Button variant="secondary" onClick={() => save({ form_shortcode: cfg.form_shortcode || DEFAULT_SHORTCODE(origin) }, 'Shortcode salvo')}>Salvar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {loading && <div className="text-xs text-gray-500">Salvando ou carregando...</div>}
    </div>
  );
}