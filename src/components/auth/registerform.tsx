"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { SignupSchema, signupSchema } from "./auth.schema";
import { useSignupMutation } from "./useAuthMutations";

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const signupMutation = useSignupMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupSchema) => {
    signupMutation.mutate({ ...data, role_type: 5 });
  };

  return (
    <>
      <div>
        {/* Company Logo and Welcome Message */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-semibold mb-2">Create an account</h1>
            <p className="text-sm mx-20 text-center text-[#8c8c8c]">
              Start your journey with us today.
            </p>
          </div>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-5">
            {/* Name Input */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <input
                id="name"
                type="text"
                placeholder="Enter your Name"
                className={`rounded-xl pr-4 pl-4 pt-3 pb-3 bg-[#F5F5F5] placeholder:text-[#8C8C8C] ${
                  errors.name ? "border-red-500" : ""
                }`}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Email Input */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
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
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Signup Button */}
            <Button
              type="submit"
              disabled={signupMutation.isPending}
              className="bg-[#0094CB] text-white w-full rounded-3xl mt-4 px-4 py-6">
              {signupMutation.isPending ? "Signing up..." : "Sign up"}
            </Button>
          </div>
          <div className="mt-2 text-center text-sm text-[#8C8C8C]">
            Already have an account?{" "}
            <Link href="/login" className="hover:underline text-[#2772D7]">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

export default RegisterForm;
