import { createContext, ReactNode, useContext, useState } from "react";

type PaymentData = {
  paymentId: string;
  amount: number;
  currency: string;
  type: "plan" | "consumable";
  name: string;
  plan_due_date?: string;
};

type PaymentContextType = {
  payment: PaymentData | null;
  setPayment: (data: PaymentData) => void;
  clearPayment: () => void;
};

const PaymentContext = createContext<PaymentContextType>({
  payment: null,
  setPayment: () => {},
  clearPayment: () => {},
});

export const usePayment = () => useContext(PaymentContext);

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const [payment, setPaymentState] = useState<PaymentData | null>(null);

  const setPayment = (data: PaymentData) => setPaymentState(data);
  const clearPayment = () => setPaymentState(null);

  return (
    <PaymentContext.Provider value={{ payment, setPayment, clearPayment }}>
      {children}
    </PaymentContext.Provider>
  );
};
