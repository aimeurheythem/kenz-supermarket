import { Link } from "react-router-dom";
import { ShoppingCart, BarChart3, Shield, Smartphone, Wifi, Globe } from "lucide-react";

const features = [
  { icon: ShoppingCart, title: "Point of Sale", desc: "Fast, intuitive checkout with barcode scanning and offline capability." },
  { icon: BarChart3, title: "Real-Time Reports", desc: "Sales summaries, top products, stock alerts and cashier performance at a glance." },
  { icon: Shield, title: "Multi-Tenant Security", desc: "Complete data isolation between stores with role-based access control." },
  { icon: Smartphone, title: "Mobile App", desc: "Manage your store on the go — scan barcodes, check stock, view sales from your phone." },
  { icon: Wifi, title: "Offline-First POS", desc: "Process sales without internet. Everything syncs automatically when back online." },
  { icon: Globe, title: "Multilingual", desc: "Support for English, French and Arabic with RTL layout." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-xl font-bold text-blue-600">Kenz POS</span>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign In</Link>
            <Link to="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900">
          Cloud-Powered Supermarket Management
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          Run your supermarket from anywhere — POS, inventory, suppliers, customers and reports all in one platform. Start with a 14-day free trial.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700">
            Start Free Trial
          </Link>
          <Link to="/pricing" className="rounded-lg border border-gray-300 px-6 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50">
            View Pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">Everything You Need</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border p-6">
              <f.icon className="mb-4 h-8 w-8 text-blue-600" />
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16 text-center text-white">
        <h2 className="mb-4 text-3xl font-bold">Ready to get started?</h2>
        <p className="mb-8 text-lg text-blue-100">14-day free trial. No credit card required.</p>
        <Link to="/register" className="rounded-lg bg-white px-8 py-3 text-lg font-medium text-blue-600 hover:bg-blue-50">
          Create Your Store
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Kenz POS. All rights reserved.
      </footer>
    </div>
  );
}
