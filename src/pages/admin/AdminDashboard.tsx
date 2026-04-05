import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import {
  ShieldAlert,
  CheckCircle,
  ArrowUpRight,
  Users,
  Settings,
  ShieldCheck,
  KeyRound,
  Activity,
  BarChart3,
  FolderCog,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalAssets: number;
  activeRoles: number;
}

function StatsCard({
  label,
  value,
  badge,
  variant = "default",
  delay = 0,
}: {
  label: string;
  value: number;
  badge?: { text: string; color: string };
  variant?: "default" | "success" | "warning";
  delay?: number;
}) {
  return (
    <div
      className="group relative overflow-hidden bg-white border border-slate-200/50 rounded-4xl p-8 shadow-[0_2px_24px_-8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1"
      style={{
        animationDelay: `${delay}ms`,
        transition:
          "transform 0.7s cubic-bezier(0.32,0.72,0,1), box-shadow 0.7s cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      <div
        className="absolute inset-0 bg-linear-to-br from-slate-50/80 via-transparent to-white/40 opacity-0 group-hover:opacity-100"
        style={{ transition: "opacity 0.7s cubic-bezier(0.32,0.72,0,1)" }}
      />

      <div className="relative z-10">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl md:text-6xl font-semibold tracking-tight text-slate-900 font-['system-ui','SF_Pro_Display','Geist_Sans','Helvetica_Neue',sans-serif]">
            {value}
          </span>
          {badge && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.12em] font-medium ${badge.color}`}
            >
              {variant === "success" && <CheckCircle className="w-3 h-3" />}
              {variant === "warning" && <ShieldAlert className="w-3 h-3" />}
              {badge.text}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-5 uppercase tracking-[0.15em] font-medium">
          {label}
        </p>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-200/60 to-transparent opacity-0 group-hover:opacity-100"
        style={{ transition: "opacity 0.7s" }}
      />
    </div>
  );
}

function ActionCard({
  action,
  delay = 0,
}: {
  action: { to: string; icon: React.ReactNode; label: string; desc: string };
  delay?: number;
}) {
  return (
    <Link
      to={action.to}
      className="group block relative overflow-hidden bg-white border border-slate-200/50 rounded-4xl p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_-10px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:scale-[0.98]"
      style={{
        animationDelay: `${delay}ms`,
        transition:
          "transform 0.5s cubic-bezier(0.32,0.72,0,1), box-shadow 0.5s cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      <div
        className="absolute inset-0 bg-linear-to-br from-slate-50/60 via-transparent to-white/50 opacity-0 group-hover:opacity-100"
        style={{ transition: "opacity 0.5s cubic-bezier(0.32,0.72,0,1)" }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col gap-4">
          <div
            className="w-11 h-11 rounded-[1.25rem] bg-slate-100/60 border border-slate-200/40 flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:bg-white group-hover:border-slate-300/50"
            style={{ transition: "all 0.4s cubic-bezier(0.32,0.72,0,1)" }}
          >
            {action.icon}
          </div>
          <div>
            <span className="text-sm font-medium text-slate-900 block group-hover:text-black">
              {action.label}
            </span>
            <span className="text-xs text-slate-500 mt-1 block group-hover:text-slate-600">
              {action.desc}
            </span>
          </div>
        </div>

        <div
          className="w-8 h-8 rounded-full bg-slate-100/60 border border-slate-200/40 flex items-center justify-center text-slate-400 group-hover:text-slate-700 group-hover:bg-white group-hover:border-slate-300/50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          style={{ transition: "all 0.4s cubic-bezier(0.32,0.72,0,1)" }}
        >
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { count: assetsCount, error: assetsError } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      if (assetsError) throw assetsError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role");

      if (rolesError) throw rolesError;

      const uniqueRoles = new Set(rolesData?.map((r) => r.role)).size;

      return {
        totalUsers: rolesData?.length || 0,
        totalAssets: assetsCount || 0,
        activeRoles: uniqueRoles,
      };
    },
    staleTime: 60000,
  });

  const roleTitle = user?.email?.split("@")[0] || "Admin";

  const actions = [
    {
      to: "/admin/users",
      icon: <Users className="w-5 h-5" />,
      label: "User Management",
      desc: "Manage accounts & roles",
    },
    {
      to: "/admin/permissions",
      icon: <ShieldCheck className="w-5 h-5" />,
      label: "Permissions",
      desc: "Access control policies",
    },
    {
      to: "/admin/auth",
      icon: <KeyRound className="w-5 h-5" />,
      label: "Authentication",
      desc: "SSO & security settings",
    },
    {
      to: "/admin/system",
      icon: <Settings className="w-5 h-5" />,
      label: "System",
      desc: "Configuration & integrations",
    },
    {
      to: "/admin/audit",
      icon: <Activity className="w-5 h-5" />,
      label: "Audit Log",
      desc: "Activity & compliance",
    },
    {
      to: "/admin/categories",
      icon: <FolderCog className="w-5 h-5" />,
      label: "Categories",
      desc: "Manage taxonomy",
    },
    {
      to: "/admin/reports",
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Reports",
      desc: "Analytics & exports",
    },
  ];

  return (
    <div className="min-h-dvh bg-[#FAFAFA] font-['system-ui','SF_Pro_Display','Geist_Sans','Helvetica_Neue',sans-serif]">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:px-8 md:py-16 lg:py-20">
        {/* Header */}
        <header className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/50 mb-6">
                <span className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-medium">
                  Dashboard
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-slate-900 tracking-tight leading-[1.05]">
                Hi {roleTitle} 👋
              </h1>
              <p className="text-sm text-slate-500 mt-4 max-w-md font-normal">
                Manage users, permissions, and system settings
              </p>
            </div>
          </div>
        </header>

        {/* Stats Row */}
        {!isLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
            <div
              className="animate-fade-up"
              style={{
                animationFillMode: "both",
                animationDelay: "0ms",
                animationDuration: "800ms",
              }}
            >
              <StatsCard
                label="Total Users"
                value={stats.totalUsers}
                badge={{
                  text: "System",
                  color:
                    "bg-slate-100 text-slate-700 border border-slate-200/50",
                }}
                delay={0}
              />
            </div>
            <div
              className="animate-fade-up"
              style={{
                animationFillMode: "both",
                animationDelay: "100ms",
                animationDuration: "800ms",
              }}
            >
              <StatsCard
                label="Total Assets"
                value={stats.totalAssets}
                badge={{
                  text: "Inventory",
                  color:
                    "bg-indigo-50 text-indigo-700 border border-indigo-200/50",
                }}
                delay={100}
              />
            </div>
            <div
              className="animate-fade-up"
              style={{
                animationFillMode: "both",
                animationDelay: "200ms",
                animationDuration: "800ms",
              }}
            >
              <StatsCard
                label="Status Types"
                value={stats.activeRoles}
                badge={{
                  text: "Active",
                  color:
                    "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
                }}
                variant="success"
                delay={200}
              />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-200/50 rounded-4xl p-8 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.03)]"
              >
                <div className="w-24 h-14 bg-slate-100 rounded animate-pulse" />
                <div className="w-32 h-3 bg-slate-100 rounded mt-6 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Actions Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-px h-4 bg-slate-200" />
            <p className="text-[11px] text-slate-400 uppercase tracking-[0.15em] font-medium">
              Quick Actions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {actions.map((action, index) => (
              <div
                key={action.to}
                className="animate-fade-up"
                style={{
                  animationFillMode: "both",
                  animationDelay: `${(index + 3) * 80}ms`,
                  animationDuration: "800ms",
                }}
              >
                <ActionCard action={action} delay={(index + 3) * 80} />
              </div>
            ))}
          </div>
        </section>

        {/* Footer info */}
        <footer className="mt-16 pt-8 border-t border-slate-200/60">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span>Copyright 2026 | Langpros Language Solutions</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
