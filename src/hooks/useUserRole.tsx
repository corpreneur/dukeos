import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "technician" | "customer";

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data.role as AppRole;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { role: role ?? "customer", isLoading, isAdmin: role === "admin", isTechnician: role === "technician", isCustomer: role === "customer" || !role };
};
