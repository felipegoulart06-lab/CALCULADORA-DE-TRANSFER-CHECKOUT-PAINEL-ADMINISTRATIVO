import React from 'react';
import { Cpu, Server, Database, Shield, Code, Cloud, Wifi, GitBranch, CircuitBoard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TechRow = () => (
  <div className="flex items-center gap-8 pr-8">
    <Cpu className="h-6 w-6 text-white" />
    <Server className="h-6 w-6 text-white" />
    <Database className="h-6 w-6 text-white" />
    <Shield className="h-6 w-6 text-white" />
    <Code className="h-6 w-6 text-white" />
    <Cloud className="h-6 w-6 text-white" />
    <Wifi className="h-6 w-6 text-white" />
    <GitBranch className="h-6 w-6 text-white" />
    <CircuitBoard className="h-6 w-6 text-white" />
    <Lock className="h-6 w-6 text-white" />
    <span className="w-24 h-px bg-white/20" />
    <Cpu className="h-6 w-6 text-white" />
    <Server className="h-6 w-6 text-white" />
    <Database className="h-6 w-6 text-white" />
    <Shield className="h-6 w-6 text-white" />
    <Code className="h-6 w-6 text-white" />
    <Cloud className="h-6 w-6 text-white" />
    <Wifi className="h-6 w-6 text-white" />
    <GitBranch className="h-6 w-6 text-white" />
    <CircuitBoard className="h-6 w-6 text-white" />
    <Lock className="h-6 w-6 text-white" />
  </div>
);

export default function Sobre() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Sobre</h1>
        <Button variant="outline" asChild>
          <a href="/docs" target="_blank" rel="noreferrer">Acessar documentação do sistema</a>
        </Button>
      </div>

      <div className="space-y-2 text-sm">
        <p>
          Criado orgulhosamente por <strong>Active Background</strong> © Todos os direitos reservados
        </p>
        <p>
          Aviso: qualquer cópia, engenharia reversa ou tentativa de invasão ao banco de dados <strong>PostgreSQL</strong> será registrada, auditada e poderá resultar em medidas legais e bloqueio imediato de acesso.
        </p>
        <p>
          Plataforma de <strong>código fechado</strong>.
        </p>
        <p>
          Versão <strong>1.0</strong> — atualizado em <strong>26/10/2025 às 22:12:06</strong>
        </p>
        <p>
          Atualização disponível a cada <strong>60 dias</strong>.
        </p>
      </div>

      <div className="pb-12">
        <h2 className="text-lg font-semibold mb-2">Tecnologias utilizadas</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm columns-2">
          <li>React 18</li>
          <li>TypeScript</li>
          <li>Vite</li>
          <li>Tailwind CSS</li>
          <li>shadcn/ui (Toaster, Sonner, TooltipProvider)</li>
          <li>React Router</li>
          <li>TanStack Query</li>
          <li>Supabase (Auth, Storage, Postgres, Row Level Security)</li>
          <li>Prisma ORM</li>
          <li>Express.js</li>
          <li>Node.js (Crypto, HMAC-SHA1)</li>
          <li>PostgreSQL</li>
          <li>JSON Web Token (JWT)</li>
          <li>CORS</li>
          <li>Fetch API</li>
          <li>Lucide Icons</li>
          <li>Google Maps Geocoding (via util)</li>
          <li>OSRM Routing API pública</li>
          <li>Base32 Encoding</li>
          <li>TOTP (RFC 6238)</li>
          <li>LocalStorage & SessionStorage</li>
          <li>URLSearchParams</li>
          <li>ES Modules / HMR (Hot Module Replacement)</li>
          <li>HTML5, CSS3, SVG</li>
          <li>PostCSS</li>
          <li>Tailwind Config & Design Tokens</li>
          <li>iframes para embed (Shortcode)</li>
          <li>OS de desenvolvimento Windows (PowerShell)</li>
        </ul>
      </div>

      {/* Animação removida conforme solicitação */}
    </div>
  );
}