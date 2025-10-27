import React, { useEffect, useState } from 'react';
import { API_URL } from '../api';

type ConfigRotas = {
  id?: number;
  tarifa_base?: number;
  preco_km?: number;
  preco_minuto?: number;
  taxa_retorno?: number;
  taxa_minima?: number;
  multiplicador_noturno?: number;
  multiplicador_fim_semana?: number;
  taxa_espera?: number;
  margem_lucro?: number;
  desconto_ida_volta?: number;
  distancia_maxima?: number;
  moeda?: string;
  unidade_distancia?: string;
  google_maps_api_key?: string;
};

export default function RotasTarifas() {
  const [cfg, setCfg] = useState<ConfigRotas>({ moeda: 'BRL', unidade_distancia: 'km', taxa_minima: 80, preco_km: 3.5, desconto_ida_volta: 10 });
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const token = localStorage.getItem('admin_token') || '';

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_URL}/config/rotas`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await r.json();
        if (json) setCfg(json);
      } catch {}
      try {
        const r2 = await fetch(`${API_URL}/logs`, { headers: { Authorization: `Bearer ${token}` } });
        const j2 = await r2.json();
        setLogs(j2);
      } catch {}
    })();
  }, [token]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}/config/rotas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(cfg),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json?.message || 'Falha ao salvar');
      alert('Configurações salvas com sucesso');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const numInput = (key: keyof ConfigRotas, step = 0.01) => (
    <input
      type="number"
      step={step}
      className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
      value={(cfg[key] as any) ?? ''}
      onChange={(e) => setCfg({ ...cfg, [key]: e.target.value === '' ? undefined : Number(e.target.value) })}
    />
  );

  return (
    <div className="space-y-6 w-full max-w-[100vw] overflow-x-hidden px-2 sm:px-4 md:px-6">
      <h1 className="text-xl font-semibold">Rotas & Tarifas</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Tarifas Base</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Tarifa base padrão (R$)</label>
              {numInput('tarifa_base')}
            </div>
            <div>
              <label className="text-sm">Taxa mínima por viagem (R$)</label>
              {numInput('taxa_minima')}
            </div>
            <div>
              <label className="text-sm">Preço por KM (R$)</label>
              {numInput('preco_km')}
            </div>
            <div>
              <label className="text-sm">Preço por minuto (R$)</label>
              {numInput('preco_minuto')}
            </div>
            <div>
              <label className="text-sm">Taxa de espera (R$/minuto)</label>
              {numInput('taxa_espera')}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Multiplicadores & Descontos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Multiplicador noturno</label>
              {numInput('multiplicador_noturno')}
            </div>
            <div>
              <label className="text-sm">Multiplicador de fim de semana</label>
              {numInput('multiplicador_fim_semana')}
            </div>
            <div>
              <label className="text-sm">Desconto ida e volta (%)</label>
              {numInput('desconto_ida_volta')}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Configurações Globais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Moeda padrão</label>
              <select className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={cfg.moeda || ''} onChange={(e) => setCfg({ ...cfg, moeda: e.target.value })}>
                <option value="">Selecione...</option>
                <option value="BRL">BRL</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Unidade de distância</label>
              <select className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={cfg.unidade_distancia || ''} onChange={(e) => setCfg({ ...cfg, unidade_distancia: e.target.value })}>
                <option value="">Selecione...</option>
                <option value="km">km</option>
                <option value="milhas">milhas</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Configurações Avançadas</h2>
            <button className="px-3 py-1 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-sm" onClick={() => setShowAdvanced((v) => !v)}>
              {showAdvanced ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {showAdvanced && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Taxa de retorno (%)</label>
                {numInput('taxa_retorno')}
              </div>
              <div>
                <label className="text-sm">Margem de lucro (%)</label>
                {numInput('margem_lucro')}
              </div>
              <div>
                <label className="text-sm">Distância máxima por viagem (km)</label>
                {numInput('distancia_maxima', 1)}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">API Key Google Maps / Distance Matrix</label>
                <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={cfg.google_maps_api_key || ''} onChange={(e) => setCfg({ ...cfg, google_maps_api_key: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar Configurações'}</button>
      </div>

      <section>
        <h2 className="text-lg font-semibold mt-6">Últimas alterações</h2>
        <div className="mt-2 border rounded divide-y bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
          {logs.length === 0 && <div className="p-3 text-sm text-gray-500">Sem registros</div>}
          {logs.slice(0, 10).map((l) => (
            <div key={l.id} className="p-3 text-sm flex justify-between">
              <span>{l.descricao}</span>
              <span className="text-gray-500">{new Date(l.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}