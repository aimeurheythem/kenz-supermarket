import { Link } from "react-router-dom";
import { Check } from "lucide-react";

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: "Free Trial",
    price: "0",
    period: "14 days",
    description: "Try everything free for 14 days.",
    features: [
      "Unlimited products",
      "Unlimited cashiers",
      "All management features",
      "POS + Web + Mobile",
      "Real-time sync",
      "Reports & analytics",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Basic",
    price: "29",
    period: "/month",
    description: "For small stores getting started.",
    features: [
      "Up to 500 products",
      "Up to 3 cashiers",
      "All management features",
      "POS + Web + Mobile",
      "Real-time sync",
      "Reports & analytics",
      "Email support",
    ],
    cta: "Choose Basic",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "79",
    period: "/month",
    description: "For growing businesses.",
    features: [
      "Up to 10,000 products",
      "Up to 50 cashiers",
      "All management features",
      "POS + Web + Mobile",
      "Real-time sync",
      "Reports & analytics",
      "Priority support",
      "Data export",
    ],
    cta: "Choose Pro",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-blue-600">Kenz POS</Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign In</Link>
            <Link to="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h1 className="mb-4 text-center text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
        <p className="mb-12 text-center text-lg text-gray-600">Start free, upgrade as you grow.</p>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border-2 p-6 ${
                plan.highlighted ? "border-blue-600 shadow-lg" : "border-gray-200"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <div className="my-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              <p className="mb-6 text-sm text-gray-600">{plan.description}</p>
              <ul className="mb-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`block rounded-lg py-2 text-center text-sm font-medium ${
                  plan.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
