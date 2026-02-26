import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, ShieldX } from "lucide-react";
import { format } from "date-fns";

const ROLES = ["customer", "technician", "admin"] as const;

const RoleManagementTab = () => {
  const queryClient = useQueryClient();

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.rpc("admin_set_user_role", {
        target_user_id: userId,
        new_role: role as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Role added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.rpc("admin_remove_user_role", {
        target_user_id: userId,
        remove_role: role as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Role removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getRoles = (userId: string) =>
    userRoles?.filter((r: any) => r.user_id === userId).map((r: any) => r.role) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Role Management</h2>
        <p className="text-muted-foreground text-sm mt-1">Assign or remove roles for users</p>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Current Roles</TableHead>
              <TableHead>Add Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles?.map((p: any) => {
              const roles = getRoles(p.user_id);
              const availableRoles = ROLES.filter((r) => !roles.includes(r));
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name || p.user_id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {roles.length === 0 && <span className="text-sm text-muted-foreground">None</span>}
                      {roles.map((role: string) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className="gap-1 cursor-pointer hover:bg-destructive/10"
                          onClick={() => removeRole.mutate({ userId: p.user_id, role })}
                        >
                          {role}
                          <ShieldX className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {availableRoles.length > 0 && (
                      <Select onValueChange={(v) => addRole.mutate({ userId: p.user_id, role: v })}>
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue placeholder="Add role..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((r) => (
                            <SelectItem key={r} value={r}>
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> {r}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RoleManagementTab;
