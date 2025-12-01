"use client";

import GoogleLogin from "@src/components/auth/googleLogin";
import LoginForm from "@src/components/auth/loginform";
import MobileLogin from "@src/components/auth/mobileLogin";
import { Button } from "@src/components/ui/button";
import { useState } from "react";

type View = "options" | "otp" | "email";

function LoginPage() {
  const [view, setView] = useState<View>("options");

  const renderView = () => {
    switch (view) {
      case "otp":
        return <MobileLogin onBack={() => setView("options")} />;
      case "email":
        return (
          <LoginForm
            onSwitchToOtp={() => setView("otp")}
            onBack={() => setView("options")}
          />
        );
      case "options":
      default:
        return (
          <>
            <Button onClick={() => setView("otp")} className="bg-primary text-white w-full">
              Login with OTP
            </Button>
            <GoogleLogin />
            <Button
              onClick={() => setView("email")}
              variant="outline"
              className="w-full">
              Login with Email
            </Button>
          </>
        );
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <div className="flex flex-col items-center text-center mb-4">
        <h1 className="text-2xl font-semibold mb-2">Welcome back!</h1>
        <p className="text-sm text-muted-foreground px-4">
          Log in to access your personalized dashboard, reports, and tools.
        </p>
      </div>
      {renderView()}
    </div>
  );
}

export default LoginPage;
