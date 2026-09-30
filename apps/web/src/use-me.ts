import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

/** The logged-in user, their tenant and role. */
export function useMe() {
  return useQuery(["me"], api.me, { staleTime: Infinity });
}
