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
import { useState } from 'react';

const Layout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center gap-3 ml-2">
                <img 
                  src="/logo.jpg" 
                  alt="QualityPulse" 
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-blue-600">
                    QualityPulse
                  </h1>
                  <p className="text-xs text-slate-500 -mt-0.5">AI-powered Quality Assurance</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out mt-16 lg:mt-0`}
        >
          <nav className="px-4 py-6 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 bg-slate-50">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
