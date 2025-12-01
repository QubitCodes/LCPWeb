"use client";
import { Progress } from "@src/components/ui/progress";
import { useEffect, useState } from "react";

interface LoadingProgressProps {
  message?: string;
}

const LoadingProgress = ({ message = "Loading..." }: LoadingProgressProps) => {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100; // Stop at 100%
        }
        return prev + 5; // Increment by 5
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <div className="w-[60%] space-y-4">
        <Progress value={progress} className="w-full" />
        <p className="text-center text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default LoadingProgress;
