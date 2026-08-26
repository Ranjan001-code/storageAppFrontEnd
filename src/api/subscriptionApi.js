import { axiosWithCreds, axiosWithoutCreds } from "./axiosInstances";

export const createSubscription = async (planId,mode) => {
  const { data } = await axiosWithCreds.post("/subscriptions", { planId,period:mode });
  return data;
};
