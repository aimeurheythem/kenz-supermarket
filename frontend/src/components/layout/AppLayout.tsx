import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  LayoutDashboard,
  Package,
  Layers,
  Truck,
  ClipboardList,
  Users as UsersIcon,
  UserCheck2,
  BarChart3,
  DollarSign,
  Tag,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  ArrowUpDown,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const menuGroups: NavGroup[] = [
  {
    title: "General",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["owner", "manager", "cashier"] },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Products", path: "/inventory", icon: Package, roles: ["owner", "manager"] },
      { label: "Categories", path: "/categories", icon: Layers, roles: ["owner", "manager"] },
      { label: "Stock", path: "/stock", icon: ArrowUpDown, roles: ["owner", "manager"] },
      { label: "Promotions", path: "/promotions", icon: Tag, roles: ["owner", "manager"] },
    ],
  },
  {
    title: "Supply Chain",
    items: [
      { label: "Suppliers", path: "/suppliers", icon: Truck, roles: ["owner", "manager"] },
      { label: "Purchases", path: "/purchases", icon: ClipboardList, roles: ["owner", "manager"] },
    ],
  },
  {
    title: "Sales & Customers",
    items: [
      { label: "Sales", path: "/sales", icon: ShoppingCart, roles: ["owner", "manager"] },
      { label: "Customers", path: "/customers", icon: UserCheck2, roles: ["owner", "manager", "cashier"] },
      { label: "Expenses", path: "/expenses", icon: DollarSign, roles: ["owner", "manager"] },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Reports", path: "/reports", icon: BarChart3, roles: ["owner", "manager"] },
      { label: "Users", path: "/users", icon: UsersIcon, roles: ["owner"] },
      { label: "Audit Logs", path: "/audit-logs", icon: ShieldCheck, roles: ["owner", "manager"] },
      { label: "Settings", path: "/settings", icon: Settings, roles: ["owner"] },
    ],
  },
];

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => user && item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <Package className="h-7 w-7 text-blue-600" />
        <span className="text-lg font-bold">Kenz Dashboard</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {filteredGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {group.title}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 font-medium text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="mb-2 text-sm">
          <p className="font-medium text-gray-900">{user?.full_name}</p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-white lg:block">{sidebarContent}</aside>

      {/* Sidebar - mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r bg-white transition-transform lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-2 top-4 rounded-lg p-1 text-gray-500 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <span className="text-sm text-gray-500">{user?.store_name}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
