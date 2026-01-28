import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Phone, 
  Upload, 
  FileText, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  CreditCard,
  DollarSign,
  ChevronRight,
  Settings,
  Bell,
  Search,
  Users
} from 'lucide-react';
import { useState, useEffect } from 'react';

const Layout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + B for sidebar toggle
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
      
      // Escape to close sidebar on mobile
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, roles: ['Admin', 'User'] },
    { name: 'Calls', href: '/app/calls', icon: Phone, roles: ['User'] },
    { name: 'Upload Call', href: '/app/upload', icon: Upload, roles: ['User'] },
    { name: 'Sales Data', href: '/app/sales-data', icon: DollarSign, roles: ['User'] },
    { name: 'Analytics', href: '/app/analytics', icon: BarChart3, roles: ['User'] },
    { name: 'Compliance Rules', href: '/app/rules', icon: FileText, roles: ['Admin'] },
    { name: 'User Management', href: '/app/users', icon: Users, roles: ['Admin'] },
    { name: 'System Reports', href: '/app/reports', icon: BarChart3, roles: ['Admin'] },
    { name: 'Subscription', href: '/subscription', icon: CreditCard, roles: ['Admin', 'User'] },
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => hasRole(item.roles));

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200 shadow-2xl lg:shadow-none transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarExpanded ? 'lg:w-72' : 'lg:w-20'}
        `}
        onMouseEnter={() => window.innerWidth >= 1024 && setSidebarExpanded(true)}
        onMouseLeave={() => window.innerWidth >= 1024 && setSidebarExpanded(false)}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 relative">
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => navigate('/')}>
                <img src="/logo.jpg" alt="QualityPulse" className="w-20 h-20 rounded-xl shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-105 object-cover" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <span className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                QualityPulse
              </span>
            </div>
            
            {/* Expand/Collapse Indicator */}
            <div className={`hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-2 transition-opacity duration-300 ${sidebarExpanded ? 'opacity-0' : 'opacity-100'}`}>
              <div className="w-1 h-6 bg-slate-300 rounded-full"></div>
              <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
            </div>
            
            <button 
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            <div className="mb-8">
              <p className={`px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                Main Menu
              </p>
              <div className="space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }
                        ${sidebarExpanded ? '' : 'lg:justify-center lg:px-3'}
                      `}
                      title={!sidebarExpanded ? item.name : ''}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>
                      )}
                      <item.icon 
                        className={`
                          h-5 w-5 transition-all duration-200
                          ${sidebarExpanded ? 'mr-3' : 'lg:mr-0'}
                          ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}
                        `} 
                      />
                      <span className={`transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                        {item.name}
                      </span>
                      {isActive && sidebarExpanded && (
                        <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions or Secondary Menu could go here */}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className={`bg-white rounded-xl p-3 border border-slate-200 shadow-sm mb-3 transition-all duration-300 ${sidebarExpanded ? '' : 'lg:p-2'}`}>
              <div className={`flex items-center gap-3 ${sidebarExpanded ? '' : 'lg:justify-center'}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className={`flex-1 min-w-0 transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate capitalize flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-xl transition-all duration-200 group ${sidebarExpanded ? '' : 'lg:px-2'}`}
              title={!sidebarExpanded ? 'Sign Out' : ''}
            >
              <LogOut className={`h-4 w-4 group-hover:-translate-x-1 transition-transform ${sidebarExpanded ? 'mr-2' : 'lg:mr-0'}`} />
              <span className={`transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 transition-all duration-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 hidden sm:block tracking-tight">
                {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
                Welcome back, {user?.name?.split(' ')[0]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar (Hidden on mobile) */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all w-64"
              />
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

            <button className="p-2.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors relative group">
              <Bell size={20} className="group-hover:animate-swing" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            
            <button className="p-2.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors md:hidden">
              <Search size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fade-in pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
