// import { getToken } from "@src/actions/auth-actions";
// import { logoutAndRedirect } from "@src/utils/logoutFnc";
import axios, { AxiosError, AxiosInstance } from "axios";
import { toast } from "sonner";

// Ensure that the environment variable is set

// Create an axios instance
export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  //timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  adapter: "fetch",
});

// Request interceptor
api.interceptors.request.use(
  async (requestObj) => {
    // Do something before request is sent
    // console.log("Request is being sent:", requestObj.url);
    const token = localStorage.getItem("authToken");
    if (token) {
      requestObj.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp to requests
    requestObj.headers["Request-Time"] = new Date().toISOString();
    return requestObj;
  },
  (error) => {
    if (error?.response?.data?.errorMessages) {
      return Promise.reject(error.response?.data?.errorMessages[0]);
    }
    // Handle axios Error
    if (error instanceof AxiosError) {
      return Promise.reject(error.response?.data);
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(
      `Response is being received:${
        response.config.url?.split("/").pop()?.split("?")[0]
      } `,
      response.data
    );
    return response;
  },
  (error) => {
    // console.log(error);

    // If unauthorized or forbidden, clear auth and redirect to login
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      // logoutAndRedirect();
      return Promise.reject(error);
    }

    if (error?.response?.data?.errorMessages) {
      toast.error(error.response.data.errorMessages[0]);
      return Promise.reject(Error(error.response?.data?.errorMessages[0]));
    }

    // Handle axios Error
    if (error instanceof AxiosError) {
      return Promise.reject(error.response?.data);
    }

    return Promise.reject(error);
  }
);
