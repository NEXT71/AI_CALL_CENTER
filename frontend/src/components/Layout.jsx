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
  DollarSign
} from 'lucide-react';
import { useState, useEffect } from 'react';

const Layout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'QA', 'Agent'] },
    { name: 'Calls', href: '/app/calls', icon: Phone, roles: ['Admin', 'Manager', 'QA', 'Agent'] },
    { name: 'Upload Call', href: '/app/upload', icon: Upload, roles: ['Admin', 'Manager', 'QA'] },
    { name: 'Sales Data', href: '/app/sales-data', icon: DollarSign, roles: ['Admin', 'Manager', 'QA'] },
    { name: 'Compliance Rules', href: '/app/rules', icon: FileText, roles: ['Admin', 'Manager'] },
    { name: 'Analytics', href: '/app/analytics', icon: BarChart3, roles: ['Admin', 'Manager', 'QA'] },
    { name: 'Subscription', href: '/subscription', icon: CreditCard, roles: ['Admin', 'Manager', 'QA', 'Agent'] },
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => hasRole(item.roles));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Enhanced Top Navigation */}
      <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/60 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 group"
              >
                {sidebarOpen ? <X size={24} className="group-hover:rotate-90 transition-transform duration-200" /> : <Menu size={24} className="group-hover:scale-110 transition-transform duration-200" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src="/logo.jpg" 
                    alt="QualityPulse" 
                    className="h-10 w-10 object-contain rounded-lg shadow-md ring-2 ring-white"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    QualityPulse
                  </h1>
                  <p className="text-xs text-slate-500 -mt-0.5 font-medium">AI-powered Quality Assurance</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                  title="Logout"
                >
                  <LogOut size={20} className="group-hover:scale-110 transition-transform duration-200" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Enhanced Sidebar */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/60 transition-all duration-300 ease-in-out mt-16 lg:mt-0 shadow-2xl lg:shadow-none`}
        >
          <nav className="px-4 py-6 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-semibold shadow-md border border-blue-200/50'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm'
                  }`}
                >
                  <div className={`p-2 rounded-lg mr-3 transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:scale-105'
                  }`}>
                    <Icon size={18} className={isActive ? '' : 'group-hover:scale-110 transition-transform duration-200'} />
                  </div>
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-blue-50/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 shadow-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 bg-transparent">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Enhanced Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
