import { useMutation } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export const useSignInWithOtp = () => {
  return useMutation({
    mutationFn: async (params: { phone?: string; email?: string }) => {
      let error;
      if (params.phone) {
        const { error: e } = await supabase.auth.signInWithOtp({
          phone: params.phone,
        });
        error = e;
      } else if (params.email) {
        const { error: e } = await supabase.auth.signInWithOtp({
          email: params.email,
        });
        error = e;
      } else {
        throw new Error("Either phone or email must be provided");
      }

      if (error) throw error;
    },
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async (params: {
      phone?: string;
      email?: string;
      token: string;
    }) => {
      let data, error;

      if (params.phone) {
        const res = await supabase.auth.verifyOtp({
          phone: params.phone,
          token: params.token,
          type: "sms",
        });
        data = res.data;
        error = res.error;
      } else if (params.email) {
        const res = await supabase.auth.verifyOtp({
          email: params.email,
          token: params.token,
          type: "email",
        });
        data = res.data;
        error = res.error;
      } else {
        throw new Error("Either phone or email must be provided");
      }

      if (error) {
        let message = "Something went wrong, please try again later.";

        switch (error.code) {
          case "otp_expired":
            message = "Your code is either invalid or expired.";
            break;
          case "invalid_otp":
            message = "The code you entered is incorrect.";
            break;
        }
        throw new Error(message);
      }
    },
  });
};

export const useSignOut = () => {
  return useMutation({
    mutationFn: async () => {
      let { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }
    },
  });
};
