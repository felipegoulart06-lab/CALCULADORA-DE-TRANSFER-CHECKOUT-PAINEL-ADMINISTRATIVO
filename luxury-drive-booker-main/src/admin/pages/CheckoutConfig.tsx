import React, { useEffect, useState } from 'react';
import { API_URL } from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash, PlusCircle } from 'lucide-react';

type Campo = {
  id?: number;
  nome_campo: string;
  tipo: string; // texto, email, número, data, seletor, arquivo
  obrigatorio: boolean;
  ordem: number;
  ativo: boolean;
};

type Config = {
  id?: number;
  acao_pos_envio?: 'WEBHOOK' | 'REDIRECT';
  url_destino?: string;
  metodo_http?: 'GET' | 'POST';
};

export default function CheckoutConfig() {
  const token = localStorage.getItem('admin_token') || '';
  const [campos, setCampos] = useState<Campo[]>([]);
  const [novo, setNovo] = useState<Campo>({ nome_campo: '', tipo: 'texto', obrigatorio: false, ordem: 0, ativo: true });
  const [cfg, setCfg] = useState<Config>({ acao_pos_envio: 'WEBHOOK', metodo_http: 'POST', url_destino: '' });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Campos padrão já presentes no Checkout (não editáveis aqui)
  const BASE_CHECKOUT_FIELDS: Campo[] = [
    { nome_campo: 'Nome completo', tipo: 'texto', obrigatorio: true, ordem: 1, ativo: true },
    { nome_campo: 'E-mail', tipo: 'email', obrigatorio: true, ordem: 2, ativo: true },
    { nome_campo: 'Telefone/WhatsApp', tipo: 'texto', obrigatorio: true, ordem: 3, ativo: true },
    { nome_campo: 'CPF', tipo: 'texto', obrigatorio: true, ordem: 4, ativo: true },
  ];
  const load = async () => {
    try {
      const r1 = await fetch(`${API_URL}/checkout/campos`, { headers: { Authorization: `Bearer ${token}` } });
      const j1 = await r1.json();
      setCampos(Array.isArray(j1) ? j1 : []);
    } catch {}
    try {
      const r2 = await fetch(`${API_URL}/checkout/config`, { headers: { Authorization: `Bearer ${token}` } });
      const j2 = await r2.json();
      if (j2) setCfg(j2);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const addCampo = async () => {
    if (!novo.nome_campo.trim()) return alert('Informe o nome do campo');
    const body = { ...novo, ordem: campos.length ? Math.max(...campos.map(c => c.ordem)) + 1 : 1 };
    try {
      const r = await fetch(`${API_URL}/checkout/campos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error('Falha ao criar campo');
      setNovo({ nome_campo: '', tipo: 'texto', obrigatorio: false, ordem: 0, ativo: true });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const updateCampo = async (c: Campo) => {
    try {
      const r = await fetch(`${API_URL}/checkout/campos/${c.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(c)
      });
      if (!r.ok) throw new Error('Falha ao atualizar campo');
      load();
    } catch (e: any) { alert(e.message); }
  };

  const updateOrdem = async (id: number, ordem: number) => {
    try {
      await fetch(`${API_URL}/checkout/campos/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ordem })
      });
    } catch {}
  };

  const removeCampo = async (c: Campo) => {
    if (!confirm(`Excluir campo ${c.nome_campo}?`)) return;
    try {
      await fetch(`${API_URL}/checkout/campos/${c.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch {}
  };

  const saveCfg = async () => {
    try {
      const r = await fetch(`${API_URL}/checkout/config`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(cfg)
      });
      if (!r.ok) throw new Error('Falha ao salvar configuração');
      alert('Configuração salva');
      load();
    } catch (e: any) { alert(e.message); }
  };

  const onDrop = async (dropIndex: number) => {
    if (dragIndex === null) return;
    const list = [...campos];
    const [moved] = list.splice(dragIndex, 1);
    list.splice(dropIndex, 0, moved);
    const reord = list.map((c, i) => ({ ...c, ordem: i + 1 }));
    setCampos(reord);
    // Persistir ordens
    for (const c of reord) {
      if (typeof c.id === 'number') await updateOrdem(c.id, c.ordem);
    }
    setDragIndex(null);
  };

  const setCampoProp = (id: number, prop: keyof Campo, value: any) => {
    setCampos(prev => prev.map(c => (c.id === id ? { ...c, [prop]: value } : c)));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Campos do Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campos padrão do Checkout */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Campos padrão do Checkout (já existentes e sempre exibidos)</div>
            {BASE_CHECKOUT_FIELDS.map((c, idx) => (
              <div key={`base-${idx}`} className="grid md:grid-cols-5 gap-3 items-center p-3 rounded border bg-white dark:bg-neutral-800">
                <div className="md:col-span-2">
                  <Input value={c.nome_campo} disabled />
                </div>
                <div>
                  <Select value={c.tipo}>
                    <SelectTrigger disabled>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="texto">Texto</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 text-sm text-muted-foreground flex items-center justify-end">Campos base do sistema</div>
              </div>
            ))}
          </div>

          {/* Novo campo */}
          <div className="grid md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <Label>Nome do campo</Label>
              <Input value={novo.nome_campo} onChange={e => setNovo({ ...novo, nome_campo: e.target.value })} placeholder="Ex: CPF" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={novo.tipo} onValueChange={(v) => setNovo({ ...novo, tipo: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">Texto</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="número">Número</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="seletor">Seletor</SelectItem>
                  <SelectItem value="arquivo">Arquivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button onClick={addCampo} className="w-full"><PlusCircle className="h-4 w-4" />Adicionar campo</Button>
            </div>
          </div>

          {/* Lista de campos */}
          <div className="space-y-2">
            {campos.filter(c => !BASE_NAMES.includes(c.nome_campo)).map((c, idx) => (
              <div
                key={c.id || idx}
                className="grid md:grid-cols-5 gap-3 items-center p-3 rounded border bg-white dark:bg-neutral-800"
              >
                <div className="md:col-span-2">
                  <Input value={c.nome_campo} disabled />
                </div>
                <div>
                  <Select value={c.tipo}>
                    <SelectTrigger disabled>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="texto">Texto</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="número">Número</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                      <SelectItem value="seletor">Seletor</SelectItem>
                      <SelectItem value="arquivo">Arquivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="destructive" onClick={() => removeCampo(c)} title="Excluir"><Trash className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {campos.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhum campo adicional cadastrado.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações pós-envio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Ação</Label>
              <Select value={cfg.acao_pos_envio || 'WEBHOOK'} onValueChange={(v) => setCfg({ ...cfg, acao_pos_envio: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEBHOOK">Webhook</SelectItem>
                  <SelectItem value="REDIRECT">Redirecionar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL destino</Label>
              <Input value={cfg.url_destino || ''} onChange={e => setCfg({ ...cfg, url_destino: e.target.value })} placeholder="https://seu-endpoint.com/payload" />
            </div>
            <div>
              <Label>Método HTTP</Label>
              <Select value={cfg.metodo_http || 'POST'} onValueChange={(v) => setCfg({ ...cfg, metodo_http: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Button onClick={saveCfg}>Salvar configuração</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}