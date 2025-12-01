import { useAppMutation } from "@src/hooks/commons/useMutationData";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Types based on API documentation
interface AuthResponse {
  success: boolean;
  message: string;
  operation_type?: string;
  token?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role_type: number;
  };
}

type LoginVariables = {
  email: string;
  password: string;
  role_type: number;
};

type SignupVariables = {
  name: string;
  email: string;
  password: string;
  role_type: number;
};

export const useLoginMutation = () => {
  const router = useRouter();
  return useAppMutation<AuthResponse, LoginVariables>({
    endpoint: "/api/doc/auth/login",
    name: "Login",
    onSuccess: (response) => {
      const user = response.data?.user;
      const token = (response.misc?.auth as { access_token?: string })
        ?.access_token;
      // The success toast is already shown by useAppMutation.
      if (token) {
        localStorage.setItem("authToken", token);
        router.push("/dashboard");
      }
      if (user) localStorage.setItem("user", JSON.stringify(user));
    },
  });
};

export const useSignupMutation = () => {
  const router = useRouter();
  return useAppMutation<AuthResponse, SignupVariables>({
    endpoint: "/api/doc/auth/signup",
    name: "Signup",
    onSuccess: (response) => {
      if (response.status) {
        toast.success(response.message || "Signup successful! Please log in.");
        router.push("/login");
      } else {
        toast.error(response.message || "Signup failed");
      }
    },
  });
};
