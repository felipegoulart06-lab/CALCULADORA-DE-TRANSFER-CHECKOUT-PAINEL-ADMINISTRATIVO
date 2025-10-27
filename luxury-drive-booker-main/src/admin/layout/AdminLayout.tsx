import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Car, Cog, CreditCard, LogOut, Menu, Settings, X, Info, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('lux-theme') as 'light' | 'dark') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) navigate('/admin/login');
  }, [navigate]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('lux-theme', theme);
  }, [theme]);

  const userName = JSON.parse(localStorage.getItem('admin_user') || '{}')?.nome || 'Administrador';
  const projectName = localStorage.getItem('lux-project-name') || 'Luxury Drive';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 flex w-full overflow-x-hidden">
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${collapsed ? 'md:w-16' : 'md:w-64'} w-64 transition-transform md:transition-all duration-200 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 p-3 flex flex-col`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{projectName}</span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-700" aria-label="Fechar menu">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="mt-4 space-y-1">
          <NavLink to="/admin/rotas-tarifas" onClick={() => setSidebarOpen(false)} className={({isActive}) => `flex items-center gap-2 p-2 rounded ${isActive ? 'bg-gray-200 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
            <Cog className="h-4 w-4" />
            {!collapsed && <span>Rotas & Tarifas</span>}
          </NavLink>
          <NavLink to="/admin/veiculos" onClick={() => setSidebarOpen(false)} className={({isActive}) => `flex items-center gap-2 p-2 rounded ${isActive ? 'bg-gray-200 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
            <Car className="h-4 w-4" />
            {!collapsed && <span>Veículos</span>}
          </NavLink>
          <NavLink to="/admin/menu-front" onClick={() => setSidebarOpen(false)} className={({isActive}) => `flex items-center gap-2 p-2 rounded ${isActive ? 'bg-gray-200 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
            <Menu className="h-4 w-4" />
            {!collapsed && <span>Menu Front End</span>}
          </NavLink>
          <NavLink to="/admin/checkout" onClick={() => setSidebarOpen(false)} className={({isActive}) => `flex items-center gap-2 p-2 rounded ${isActive ? 'bg-gray-200 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
            <CreditCard className="h-4 w-4" />
            {!collapsed && <span>Checkout</span>}
          </NavLink>
          <NavLink to="/admin/configuracoes" onClick={() => setSidebarOpen(false)} className={({isActive}) => `flex items-center gap-2 p-2 rounded ${isActive ? 'bg-gray-200 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
            <Settings className="h-4 w-4" />
            {!collapsed && <span>Configurações</span>}
          </NavLink>
          <NavLink to="/admin/sobre" onClick={() => setSidebarOpen(false)} className={({isActive}) => `flex items-center gap-2 p-2 rounded ${isActive ? 'bg-gray-200 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
            <Info className="h-4 w-4" />
            {!collapsed && <span>Sobre</span>}
          </NavLink>
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center absolute top-1/2 -translate-y-1/2 right-[-10px] h-8 w-8 rounded-full bg-white/90 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-black/30 md:hidden" aria-hidden="true" />
      )}
      {/* Main */}
      <div className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-700" aria-label="Abrir menu">
              <Menu className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">Logado como</span>
            <strong className="text-sm">{userName}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); navigate('/admin/login'); }}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-700"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="w-full max-w-[100vw] p-2 sm:p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}