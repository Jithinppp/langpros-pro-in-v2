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

  // If user is already logged in and has role, redirect
  useEffect(() => {
    if (session && role && !authLoading) {
      console.log("🏠 HomePage: User logged in with role, redirecting...");
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
      console.log("🔐 Signing in via Zustand store...");
      await signIn(data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1769ff] p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-white">
            <span className="font-semibold text-xl tracking-wide">
              LANGRPROS
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-5xl font-bold text-white leading-tight mb-4">
            Create.
            <br />
            Manage.
            <br />
            Inspire.
          </h2>
          <p className="text-white/70 text-lg max-w-md">
            Your all-in-one platform for project and inventory management
          </p>
        </div>

        <div className="text-white/50 text-sm">
          © Copyright 2026 | Langpros Language Solutions
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-3 text-[#1769ff]">
              <span className="font-semibold text-xl tracking-wide">
                LANGRPROS
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-500 mb-8">Enter your details to continue</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mt-5 mb-2"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                error={errors.email?.message}
                placeholder="hello@example.com"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all"
              />
            </div>

            <div className="">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mt-5 mb-2"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                error={errors.password?.message}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all"
              />
            </div>

            <Button
              variant="primary"
              type="submit"
              isLoading={loading}
              className="w-full mt-2"
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
