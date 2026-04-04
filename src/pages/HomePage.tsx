import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAuthStore } from "../store/authStore";
import { roleToPath } from "../constants/index";
import Input from "../components/Input";
import Button from "../components/Button";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function HomePage() {
  const navigate = useNavigate();
  const { session, role, loading: authLoading, signIn } = useAuthStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (session && role && !authLoading) {
      const redirectRoute = roleToPath[role];
      if (redirectRoute) {
        navigate(redirectRoute);
      }
    }
  }, [session, role, authLoading, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    setError("");
    setLoading(true);

    try {
      await signIn(data.email, data.password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-[#FAFAFA] font-['system-ui','SF_Pro_Display','Geist_Sans','Helvetica_Neue',sans-serif]">
      {/* Noise overlay - fixed */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-50 mix-blend-multiply">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#050505] relative overflow-hidden p-12 flex-col justify-between">
        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(120,80,255,0.12)_0%,transparent_70%)] blur-[120px]" />
          <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(80,200,120,0.08)_0%,transparent_70%)] blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="font-semibold text-lg tracking-[0.2em] uppercase">
              LangPros
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-[0.95] tracking-tight">
            Create.<br />
            Manage.<br />
            <span className="text-white/40">Inspire.</span>
          </h2>
          <p className="text-white/50 text-sm max-w-sm mt-8 leading-relaxed">
            Your all-in-one platform for project and inventory management
          </p>
        </div>

        <div className="relative z-10 text-white/30 text-xs tracking-widest uppercase">
          © 2026 Langpros Language Solutions
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 md:p-12 lg:p-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12">
            <div className="flex items-center gap-3 text-[#050505]">
              <div className="w-2 h-2 bg-[#050505] rounded-full" />
              <span className="font-semibold text-lg tracking-[0.2em] uppercase">
                LangPros
              </span>
            </div>
          </div>

          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/50 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-medium">
                Authentication
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight leading-[1.05]">
              Welcome back
            </h1>
            <p className="text-slate-500 mt-3 text-sm">
              Enter your credentials to continue
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-[1rem]">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-500 uppercase tracking-[0.1em] mb-3"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                error={errors.email?.message}
                placeholder="hello@example.com"
                className="w-full px-5 py-4 rounded-[1.25rem] bg-white border border-slate-200/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 transition-all shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-500 uppercase tracking-[0.1em] mb-3"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                error={errors.password?.message}
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-[1.25rem] bg-white border border-slate-200/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 transition-all shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]"
              />
            </div>

            <Button
              variant="primary"
              type="submit"
              isLoading={loading}
              className="w-full mt-4"
              size="lg"
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
