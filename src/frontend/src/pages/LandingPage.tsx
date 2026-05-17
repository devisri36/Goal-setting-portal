import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle,
  Lock,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { DEMO_USERS, getRoleDashboardPath } from "../lib/backend-helpers";
import { UserRole } from "../lib/types";
import { useAuth } from "../store/authStore";

const roleColors: Record<
  UserRole,
  { bg: string; border: string; badge: string; icon: string }
> = {
  [UserRole.Employee]: {
    bg: "bg-card hover:bg-secondary/30",
    border: "border-border hover:border-primary/40",
    badge: "bg-chart-2/15 text-chart-2 border border-chart-2/30",
    icon: "bg-chart-2/10 text-chart-2",
  },
  [UserRole.Manager]: {
    bg: "bg-card hover:bg-secondary/30",
    border: "border-border hover:border-chart-4/40",
    badge: "bg-chart-4/15 text-chart-4 border border-chart-4/30",
    icon: "bg-chart-4/10 text-chart-4",
  },
  [UserRole.Admin]: {
    bg: "bg-card hover:bg-secondary/30",
    border: "border-border hover:border-destructive/40",
    badge: "bg-destructive/10 text-destructive border border-destructive/30",
    icon: "bg-destructive/10 text-destructive",
  },
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  [UserRole.Employee]: <TrendingUp size={20} />,
  [UserRole.Manager]: <Users size={20} />,
  [UserRole.Admin]: <Shield size={20} />,
};

const features = [
  { icon: <Target size={18} />, label: "Goal Creation & Approval" },
  { icon: <CheckCircle size={18} />, label: "Quarterly Check-ins" },
  { icon: <TrendingUp size={18} />, label: "Achievement Tracking" },
  { icon: <Lock size={18} />, label: "Audit Trail & Governance" },
];

export default function LandingPage() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const { loginAsDemo, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (demoKey: string) => {
    setLoadingKey(demoKey);
    const user = await loginAsDemo(demoKey);
    if (user) {
      void navigate({ to: getRoleDashboardPath(user.role) as string });
    }
    setLoadingKey(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav */}
      <nav className="bg-card border-b border-border shadow-subtle">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles size={16} className="text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-foreground text-sm">
                ATOMQUEST
              </span>
              <span className="text-muted-foreground text-sm">
                {" "}
                Hackathon 1.0
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
              Goal Setting & Tracking Portal
            </span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
            <Sparkles size={12} />
            ATOMQUEST Hackathon 1.0 — Live Demo
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            In-House Goal Setting
            <br />
            <span className="text-primary">&amp; Tracking Portal</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            A structured digital portal for the full lifecycle of employee goals
            — from creation and alignment to quarterly check-ins and performance
            visibility.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 bg-background border border-border rounded-full px-4 py-2 text-sm text-muted-foreground"
              >
                <span className="text-primary">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Login Section */}
      <section className="flex-1 bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Choose a Demo Role to Explore
            </h2>
            <p className="text-muted-foreground text-sm">
              Instant access — no account setup required. Switch roles anytime.
            </p>
          </div>

          {error && (
            <div
              className="mb-6 max-w-md mx-auto bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm text-center"
              data-ocid="landing.error_state"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {DEMO_USERS.map((demo, i) => {
              const colors = roleColors[demo.role];
              const isLoading = loadingKey === demo.key;
              return (
                <button
                  key={demo.key}
                  type="button"
                  className={`rounded-xl border p-6 transition-smooth cursor-pointer group text-left w-full ${
                    colors.bg
                  } ${colors.border}`}
                  data-ocid={`landing.demo_card.${i + 1}`}
                  disabled={!!loadingKey}
                  onClick={() => !loadingKey && handleLogin(demo.key)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.icon}`}
                    >
                      {roleIcons[demo.role]}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}
                    >
                      {demo.role}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-foreground text-lg mb-1">
                    {demo.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {demo.description}
                  </p>

                  <div className="bg-muted/60 rounded-lg p-3 mb-4 border border-border">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-medium">
                        Email
                      </span>
                      <span className="text-foreground font-mono">
                        {demo.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Demo Key
                      </span>
                      <span className="text-primary font-mono font-semibold">
                        {demo.key}
                      </span>
                    </div>
                  </div>

                  <div
                    data-ocid={`landing.login_button.${i + 1}`}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold group-hover:shadow-md pointer-events-none"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Login as {demo.role}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Evaluator note */}
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <h3 className="font-display font-semibold text-foreground mb-2">
              For Hackathon Evaluators
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Each role demonstrates a complete user journey. Start with
              Employee to create goals, switch to Manager to approve them, then
              Admin to view the audit trail and analytics.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {DEMO_USERS.map((d) => (
                <code
                  key={d.key}
                  className="bg-muted border border-border text-foreground text-xs px-3 py-1.5 rounded-md font-mono"
                >
                  {d.key}
                </code>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} ATOMQUEST Goal Portal. ATOMQUEST
            Hackathon 1.0.
          </span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-smooth"
          >
            
          </a>
        </div>
      </footer>
    </div>
  );
}
