import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createSubscription } from "./api/subscriptionApi";
import { fetchUser } from "./api/userApi";

const PLAN_CATALOG = {
  monthly: [
    {
      // id: "plan_RSGPm194Bj0Rqr",
      id: "plan_TTrLc8yCZqZBAI",
      name: "Starter",
      tagline: "Great for individuals",
      storage: "2 TB",
      price: 199,
      period: "/mo",
      cta: "Choose 2 TB",
      features: [
        "Secure cloud storage",
        "Link & folder sharing",
        "Basic support",
      ],
      popular: false,
    },
    {
      // id: "plan_RSGQzIncll0pyD",
      id: "plan_TTrMt7NsTWZ7E3",
      name: "Pro",
      tagline: "For creators & devs",
      storage: "5 TB",
      price: 399,
      period: "/mo",
      cta: "Choose 5 TB",
      features: ["Everything in Starter", "Priority uploads", "Email support"],
      popular: true,
    },
    {
      // id: "plan_RSGRwZz8Etth4Z",
      id: "plan_TTrNCEObL2OhMo",
      name: "Ultimate",
      tagline: "Teams & power users",
      storage: "10 TB",
      price: 699,
      period: "/mo",
      cta: "Choose 10 TB",
      features: ["Everything in Pro", "Version history", "Priority support"],
      popular: false,
    },
  ],
  yearly: [
    {
      // id: "plan_RSGQ0zJcEnFyrb",
      id: "plan_TTrNqbKjXcGqZE",
      name: "Starter",
      tagline: "Great for individuals",
      storage: "2 TB",
      price: 1999,
      period: "/yr",
      cta: "Choose 2 TB",
      features: [
        "Secure cloud storage",
        "Link & folder sharing",
        "Basic support",
      ],
      popular: false,
    },
    {
      // id: "plan_RSGRCz4Dk1OHII",
      id: "plan_TTrOMBY3wcGK1d",
      name: "Pro",
      tagline: "For creators & devs",
      storage: "5 TB",
      price: 3999,
      period: "/yr",
      cta: "Choose 5 TB",
      features: ["Everything in Starter", "Priority uploads", "Email support"],
      popular: true,
    },
    {
      // id: "plan_RSGTXYCMqGK3Dd",
      id: "plan_TTrOiRy4Tf95Yi",
      name: "Ultimate",
      tagline: "Teams & power users",
      storage: "10 TB",
      price: 6999,
      period: "/yr",
      cta: "Choose 10 TB",
      features: ["Everything in Pro", "Version history", "Priority support"],
      popular: false,
    },
  ],
};

function classNames(...cls) {
  return cls.filter(Boolean).join(" ");
}

function Price({ value }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">₹</span>
      <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function PlanCard({ plan, onSelect, currentPlanId }) {
  return (
    <div
      className={classNames(
        "relative flex flex-col rounded-2xl border bg-white dark:bg-slate-800 p-5 shadow-sm transition",
        "hover:shadow-md",
        plan.popular
          ? "border-blue-500/60 ring-1 ring-blue-500/20"
          : "border-slate-200 dark:border-slate-700",
      )}
    >
      {currentPlanId === plan.id && (
        <div className="absolute -top-2 left-4 select-none rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white shadow">
          Current Plan
        </div>
      )}
      {plan.popular && (
        <div className="absolute -top-2 right-4 select-none rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white shadow">
          Most Popular
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{plan.tagline}</p>
        </div>
        <span className="rounded-full border border-slate-200 dark:border-slate-600 px-3 py-1 text-xs text-slate-600 dark:text-slate-300">
          {plan.storage}
        </span>
      </div>

      <div className="mb-4 flex items-end gap-2">
        <Price value={plan.price} />
        <span className="mb-[6px] text-sm text-slate-500 dark:text-slate-400">{plan.period}</span>
      </div>

      <ul className="mb-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-none"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect?.(plan)}
        disabled={currentPlanId === plan.id}
        className={classNames(
          "mt-auto cursor-pointer inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800",
          plan.popular
            ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600"
            : "bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-300 focus:ring-slate-900",
        )}
      >
        {currentPlanId === plan.id ? "Already Purchased" : plan.cta}
      </button>
    </div>
  );
}

export default function Plans() {
  const [mode, setMode] = useState("monthly");
  const plans = PLAN_CATALOG[mode];
  const [userPlanId, setUserPlanId] = useState(null);

  useEffect(() => {
    const razorpayScript = document.querySelector("#razorpay-script");
    if (razorpayScript) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.id = "razorpay-script";
    document.body.appendChild(script);

    async function fetchUserPlanId() {
      try {
        const response = await fetchUser();
        setUserPlanId(response.planId);
        console.log("Fetched user planId:", response.planId);
      } catch (error) {
        console.error("Error fetching user subscription:", error);
      }
    }
    fetchUserPlanId();
  }, []);

  async function handleSelect(plan) {
    console.log("in handler");
    const { subscriptionId } = await createSubscription(plan.id,mode);
    console.log(subscriptionId);
    openRazorpayPopup({ subscriptionId });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Choose your plan
        </h1>
        <Link to="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">Home</Link>
      </header>

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1 shadow-sm">
        <button
          onClick={() => setMode("monthly")}
          className={classNames(
            "rounded-lg px-4 py-2 text-sm font-medium border-2 cursor-pointer",
            mode === "monthly"
              ? "border-blue-500 text-slate-900 dark:text-white"
              : "border-transparent text-slate-600 dark:text-slate-400",
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setMode("yearly")}
          className={classNames(
            "rounded-lg px-4 py-2 text-sm font-medium border-2 cursor-pointer",
            mode === "yearly"
              ? "border-blue-500 text-slate-900 dark:text-white"
              : "border-transparent text-slate-600 dark:text-slate-400",
          )}
        >
          Yearly{" "}
          <span className="ml-1 hidden text-xs text-blue-600 dark:text-blue-400 sm:inline">
            (2 months off)
          </span>
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={`${mode}-${plan.id}`}
            currentPlanId={userPlanId}
            plan={plan}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Small helper text */}
      <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
        Prices are indicative for demo. Integrate with Razorpay Subscriptions to
        start billing. You can prefill the plan IDs inside a static config.
      </p>
    </div>
  );
}

function openRazorpayPopup({ subscriptionId, user, course, onClose }) {
  console.log("Opening Razorpay popup for subscription:", subscriptionId);
  if (typeof window.Razorpay === "undefined") {
    alert(
      "Razorpay SDK is loading or unavailable. Please try again in a moment.",
    );
    return;
  }
  const frontendUrl =
    import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";
  const rzp = new window.Razorpay({
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    description: "Storage Plan Subscription",
    name: "Storage App",
    subscription_id: subscriptionId,
    notes: {},
    handler: async function (response) {
      console.log("Razorpay subscription payment successful:", response);
      alert("Subscription successful!");
    },
  });

  rzp.on("payment.failed", function (response) {
    console.error("Razorpay payment failed:", response);
  });

  rzp.open();
}
