import { useMutation } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export const useSignInWithOtp = () => {
  return useMutation({
    mutationFn: async (params: { email: string; phone: string }) => {
      const { data: canSignIn, error } = await supabase.rpc(
        "verify_email_phone",
        {
          _email: params.email,
          _phone: params.phone,
        }
      );

      if (error) throw error;

      if (!canSignIn) {
        throw new Error("Email and phone mismatch. Check credentials.");
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: params.email,
      });

      if (otpError) throw otpError;

      await supabase.rpc("update_profile_phone_by_email", {
        _email: params.email,
        _phone: params.phone,
      });
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
