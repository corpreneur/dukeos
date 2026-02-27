import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
  timezone: string;
  created_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export const useOrganization = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: memberships, isLoading: loadingMemberships } = useQuery({
    queryKey: ["org-memberships", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_members")
        .select("*, organizations(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as (OrgMember & { organizations: Organization })[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const activeOrg = memberships?.[0]?.organizations ?? null;

  const createOrg = useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name, slug, owner_id: user!.id })
        .select()
        .single();
      if (orgError) throw orgError;

      const { error: memberError } = await supabase
        .from("org_members")
        .insert({ org_id: org.id, user_id: user!.id, role: "owner" });
      if (memberError) throw memberError;

      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-memberships"] });
      toast.success("Organization created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const inviteMember = useMutation({
    mutationFn: async ({ orgId, userId, role = "member" }: { orgId: string; userId: string; role?: string }) => {
      const { error } = await supabase
        .from("org_members")
        .insert({ org_id: orgId, user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-memberships"] });
      toast.success("Member added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return {
    activeOrg,
    memberships: memberships ?? [],
    isLoading: loadingMemberships,
    createOrg,
    inviteMember,
    isOwner: activeOrg?.owner_id === user?.id,
  };
};
