import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "manager" | "technician" | "customer";

const ROLE_PRIORITY: Record<string, number> = { admin: 4, manager: 3, technician: 2, customer: 1 };

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      if (!data || data.length === 0) return "customer" as AppRole;
      // Return highest-priority role
      const sorted = data.sort((a, b) => (ROLE_PRIORITY[b.role] || 0) - (ROLE_PRIORITY[a.role] || 0));
      return sorted[0].role as AppRole;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { role: role ?? "customer", isLoading, isAdmin: role === "admin" || role === "manager", isTechnician: role === "technician", isCustomer: role === "customer" || !role, isManager: role === "manager" };
};
