import React, { useEffect, useState } from 'react';
import { API_URL } from '../api';

type Veiculo = {
  id?: number;
  nome: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  categoria?: string;
  passageiros?: number;
  malas?: number;
  cor?: string;
  placa?: string;
  chassi?: string;
  renavam?: string;
  cidade?: string;
  tarifa_base?: number;
  preco_km?: number;
  preco_minuto?: number;
  descricao_curta?: string;
  descricao_detalhada?: string;
  imagem_principal?: string;
  status?: 'ATIVO' | 'INATIVO' | 'MANUTENCAO';
  // Novos campos técnicos
  portas?: number;
  tracao?: string;
  combustivel?: string; // Gasolina / Diesel / Híbrido / Elétrico
  consumo_medio?: number; // km/l
  potencia_cv?: number;
  transmissao?: string;
  ar_condicionado?: boolean;
  wifi?: boolean;
  agua?: boolean;
  tomadas?: boolean;
  outros_servicos?: string;
  galeria_imagens?: string[];
  video_url?: string;
  ultima_revisao?: string; // ISO date
  proxima_revisao?: string; // ISO date
  kilometragem_atual?: number;
  seguro_valido_ate?: string; // ISO date
};

export default function Veiculos() {
  const token = localStorage.getItem('admin_token') || '';
  const [list, setList] = useState<Veiculo[]>([]);
  const [editing, setEditing] = useState<Veiculo | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const r = await fetch(`${API_URL}/veiculos`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      setList(j);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const startAdd = () => setEditing({
    nome: '', marca: '', modelo: '', ano: new Date().getFullYear(), categoria: 'Sedan',
    cor: '', placa: '', passageiros: 4, malas: 3, portas: 4,
    imagem_principal: '/placeholder.svg',
    status: 'ATIVO', ar_condicionado: true, wifi: false, agua: false, tomadas: false,
    outros_servicos: '', tracao: '', combustivel: 'Gasolina', consumo_medio: 0, potencia_cv: 0,
    transmissao: '', galeria_imagens: [], video_url: '', descricao_curta: '', descricao_detalhada: '',
    ultima_revisao: '', proxima_revisao: '', kilometragem_atual: 0, seguro_valido_ate: ''
  });
  const startEdit = (v: Veiculo) => setEditing({ ...v });
  const cancel = () => setEditing(null);

  const save = async () => {
    if (!editing) return;

    // Validações mínimas de obrigatórios
    const e = editing;
    const missing: string[] = [];
    const anoAtual = new Date().getFullYear();
    if (!e.nome?.trim()) missing.push('Nome Comercial');
    if (!e.marca?.trim()) missing.push('Marca');
    if (!e.modelo?.trim()) missing.push('Modelo');
    if (!e.ano || e.ano < 1900 || e.ano > anoAtual + 1) missing.push('Ano válido');
    if (!e.categoria?.trim()) missing.push('Categoria');
    if (!e.cor?.trim()) missing.push('Cor');
    if (!e.placa?.trim()) missing.push('Placa (interna)');
    if (!e.status) missing.push('Status');
    if (typeof e.passageiros !== 'number' || e.passageiros < 1) missing.push('Passageiros');
    if (typeof e.malas !== 'number' || e.malas < 0) missing.push('Malas');
    if (!e.imagem_principal?.trim()) missing.push('Imagem principal (URL)');
    if (!e.descricao_curta?.trim()) missing.push('Descrição comercial');

    if (missing.length) {
      alert(`Preencha os campos obrigatórios: ${missing.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const isNew = !editing.id;
      const url = isNew ? `${API_URL}/veiculos` : `${API_URL}/veiculos/${editing.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editing),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || 'Falha ao salvar');
      alert('Veículo salvo');
      setEditing(null);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (v: Veiculo) => {
    if (!confirm(`Excluir ${v.nome}?`)) return;
    try {
      await fetch(`${API_URL}/veiculos/${v.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden px-2 sm:px-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Veículos</h1>
        <button onClick={startAdd} className="bg-black text-white px-4 py-2 rounded">Adicionar Veículo</button>
      </div>

      {!editing && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((v) => (
            <div key={v.id} className="border rounded p-3 bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
              {v.imagem_principal && (
                <img src={v.imagem_principal} alt={v.nome} className="w-full h-32 object-cover rounded" />
              )}
              <div className="mt-2">
                <div className="font-medium">{v.nome}</div>
                <div className="text-sm text-gray-500">{v.marca} {v.modelo} • {v.categoria}</div>
                <div className="text-sm">{v.passageiros} passageiros • {v.malas} malas</div>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => startEdit(v)} className="px-3 py-1 rounded bg-gray-200 dark:bg-neutral-700">Editar</button>
                <button onClick={() => remove(v)} className="px-3 py-1 rounded bg-red-600 text-white">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="border rounded p-4 bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 space-y-4">
          <h2 className="font-semibold">{editing.id ? 'Editar Veículo' : 'Novo Veículo'}</h2>

          {/* Geral */}
          <div>
            <h3 className="font-medium mb-2">Geral</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Nome Comercial</label>
                <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Marca</label>
                <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.marca || ''} onChange={(e) => setEditing({ ...editing, marca: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Modelo</label>
                <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.modelo || ''} onChange={(e) => setEditing({ ...editing, modelo: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Ano</label>
                <input type="number" className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={(editing.ano ?? '') as any} onChange={(e) => setEditing({ ...editing, ano: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm">Categoria</label>
                <select className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.categoria || 'Sedan'} onChange={(e) => setEditing({ ...editing, categoria: e.target.value })}>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Van">Van</option>
                  <option value="Blindado">Blindado</option>
                  <option value="Executivo">Executivo</option>
                  <option value="Luxo">Luxo</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Cor</label>
                <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.cor || ''} onChange={(e) => setEditing({ ...editing, cor: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Placa (interna)</label>
                <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.placa || ''} onChange={(e) => setEditing({ ...editing, placa: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Status</label>
                <select className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.status || 'ATIVO'} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}>
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                  <option value="MANUTENCAO">Em manutenção</option>
                </select>
              </div>
            </div>
          </div>

          {/* Capacidade e Especificações */}
          <div>
            <h3 className="font-medium mb-2">Capacidade e Especificações</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Passageiros</label>
                <input type="number" className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={(editing.passageiros ?? '') as any} onChange={(e) => setEditing({ ...editing, passageiros: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm">Malas</label>
                <input type="number" className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={(editing.malas ?? '') as any} onChange={(e) => setEditing({ ...editing, malas: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm">Portas</label>
                <input type="number" className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={(editing.portas ?? '') as any} onChange={(e) => setEditing({ ...editing, portas: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm">Tração</label>
                <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.tracao || ''} onChange={(e) => setEditing({ ...editing, tracao: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Combustível</label>
                <select className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.combustivel || 'Gasolina'} onChange={(e) => setEditing({ ...editing, combustivel: e.target.value })}>
                  <option value="Gasolina">Gasolina</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Elétrico">Elétrico</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Consumo Médio (km/l)</label>
                <input type="number" step="0.1" className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={(editing.consumo_medio ?? '') as any} onChange={(e) => setEditing({ ...editing, consumo_medio: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm">Potência (cv)</label>
                <input type="number" className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={(editing.potencia_cv ?? '') as any} onChange={(e) => setEditing({ ...editing, potencia_cv: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm">Transmissão</label>
                <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.transmissao || ''} onChange={(e) => setEditing({ ...editing, transmissao: e.target.value })} />
              </div>
              <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.ar_condicionado} onChange={(e) => setEditing({ ...editing, ar_condicionado: e.target.checked })} /> Ar-condicionado / Climatização</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.wifi} onChange={(e) => setEditing({ ...editing, wifi: e.target.checked })} /> Wi-Fi</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.agua} onChange={(e) => setEditing({ ...editing, agua: e.target.checked })} /> Água</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.tomadas} onChange={(e) => setEditing({ ...editing, tomadas: e.target.checked })} /> Tomadas</label>
                <div className="col-span-2">
                  <label className="text-sm">Outros Serviços</label>
                  <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.outros_servicos || ''} onChange={(e) => setEditing({ ...editing, outros_servicos: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* Imagens e Mídia */}
          <div>
            <h3 className="font-medium mb-2">Imagens e Mídia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Imagem principal (URL)</label>
                <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.imagem_principal || ''} onChange={(e) => setEditing({ ...editing, imagem_principal: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Galeria de imagens (URLs, separado por vírgula)</label>
                <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={(editing.galeria_imagens || []).join(', ')} onChange={(e) => setEditing({ ...editing, galeria_imagens: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">Vídeo de apresentação (YouTube/MP4)</label>
                <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.video_url || ''} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Observações e Internos */}
          <div>
            <h3 className="font-medium mb-2">Observações e Internos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm">Descrição comercial</label>
                <textarea className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" rows={3} value={editing.descricao_curta || ''} onChange={(e) => setEditing({ ...editing, descricao_curta: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">Descrição interna (para equipe)</label>
                <textarea className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" rows={3} value={editing.descricao_detalhada || ''} onChange={(e) => setEditing({ ...editing, descricao_detalhada: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Última revisão</label>
                <input type="date" className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.ultima_revisao || ''} onChange={(e) => setEditing({ ...editing, ultima_revisao: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Próxima revisão</label>
                <input type="date" className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.proxima_revisao || ''} onChange={(e) => setEditing({ ...editing, proxima_revisao: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Kilometragem atual</label>
                <input type="number" className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={(editing.kilometragem_atual ?? '') as any} onChange={(e) => setEditing({ ...editing, kilometragem_atual: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm">Seguro válido até</label>
                <input type="date" className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" value={editing.seguro_valido_ate || ''} onChange={(e) => setEditing({ ...editing, seguro_valido_ate: e.target.value })} />
              </div>
            </div>
          </div>



          <div className="flex gap-2">
            <button onClick={save} disabled={loading} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">{loading ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={cancel} className="px-4 py-2 rounded bg-gray-200 dark:bg-neutral-700">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}