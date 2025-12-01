"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { LoginSchema, loginSchema } from "./auth.schema";
import GoogleLogin from "./googleLogin";
import { useLoginMutation } from "./useAuthMutations";

function LoginForm({
  onSwitchToOtp,
}: {
  onBack: () => void;
  onSwitchToOtp: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginSchema) => {
    loginMutation.mutate({ ...data, role_type: 2 });
  };

  return (
    <>
      {/* <ResetPasswordDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} /> */}

      <div>
        {/* Company Logo and Welcome Message */}
        <div className="flex flex-col items-center mb-8">
          {/* <Image
            src={companyIcon}
            alt="Company Logo"
            width={90}
            height={90}
            className="object-contain mb-6 blueIconColor"
          /> */}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-5">
            {/* Email Input */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="text"
                placeholder="Enter your Email"
                className={`rounded-xl pr-4 pl-4 pt-3 pb-3 bg-[#F5F5F5] placeholder:text-[#8C8C8C] ${
                  errors.email ? "border-red-500" : ""
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl pr-12 pl-4 pt-3 pb-3 bg-[#F5F5F5] placeholder:text-[#8C8C8C] ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="rounded" />
                  <label htmlFor="remember" className="text-sm">
                    Remember Me
                  </label>
                </div>
                <Link
                  href="/forgotpassword"
                  className="text-sm hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="bg-primary text-white w-full rounded-3xl mt-4 px-4 py-3">
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 font-semibold text-[#787878]">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              onClick={onSwitchToOtp}
              variant="outline"
              className="w-full rounded-3xl py-3">
              Login with OTP
            </Button>
          </div>
        </form>
        <div className="mt-4">
          <GoogleLogin />
        </div>
      </div>
    </>
  );
}

export default LoginForm;
