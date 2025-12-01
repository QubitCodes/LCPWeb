"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import LoginForm from "./loginform";

const NumberLogin = () => {
  const [showEmailForm, setShowEmailForm] = useState(false);

  if (showEmailForm) {
    return (
      <LoginForm
        onBack={() => setShowEmailForm(false)}
        onSwitchToOtp={() => {
          /* This component doesn't handle OTP switching */
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>
      <Button onClick={() => setShowEmailForm(true)} className="w-full">
        Login with Email
      </Button>
    </div>
  );
};

export default NumberLogin;
