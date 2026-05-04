/** API de autenticación. */
import axiosClient from "./axiosClient";
import type { LoginRequest, RegisterRequest, TokenResponse } from "../types";

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const res = await axiosClient.post<TokenResponse>("/auth/login", data);
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const res = await axiosClient.post<TokenResponse>("/auth/register", data);
    return res.data;
  },
};
