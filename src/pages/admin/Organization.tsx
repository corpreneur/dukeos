import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Plus, Crown, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Organization = () => {
  const { activeOrg, memberships, createOrg, inviteMember, isOwner } = useOrganization();
  const { user } = useAuth();
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Fetch org members with profiles
  const { data: orgMembers } = useQuery({
    queryKey: ["org-members-list", activeOrg?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_members")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .eq("org_id", activeOrg!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!activeOrg,
  });

  const handleCreate = () => {
    if (!newName || !newSlug) return toast.error("Name and slug required");
    createOrg.mutate({ name: newName, slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-") });
    setShowCreate(false);
    setNewName("");
    setNewSlug("");
  };

  const handleInvite = async () => {
    if (!inviteEmail || !activeOrg) return;
    // Look up user by checking profiles — simplified approach
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("full_name", `%${inviteEmail}%`)
      .limit(1)
      .maybeSingle();
    if (!profile) return toast.error("User not found");
    inviteMember.mutate({ orgId: activeOrg.id, userId: profile.user_id });
    setInviteEmail("");
  };

  if (!activeOrg) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Organization</h2>
          <p className="text-sm text-muted-foreground">Set up your franchise or business entity</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No organization yet. Create one to enable multi-tenant data isolation.</p>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Create Organization</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Organization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Organization Name</Label>
                    <Input value={newName} onChange={(e) => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} placeholder="Duke's Pet Services — Raleigh" />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="dukes-raleigh" />
                    <p className="text-xs text-muted-foreground mt-1">Unique identifier for your org</p>
                  </div>
                  <Button onClick={handleCreate} disabled={createOrg.isPending} className="w-full">
                    {createOrg.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-display font-bold text-foreground">Organization</h2>
        <p className="text-sm text-muted-foreground">Manage your franchise and team members</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {activeOrg.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Slug</span><span className="font-mono text-foreground">{activeOrg.slug}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Timezone</span><span className="text-foreground">{activeOrg.timezone}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Members</span><span className="text-foreground">{orgMembers?.length ?? 0}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orgMembers?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {(m.profiles?.full_name || "?")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-sm">{m.profiles?.full_name || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{m.role}</div>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1">
                  {m.role === "owner" ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                  {m.role}
                </Badge>
              </div>
            ))}
          </div>

          {isOwner && (
            <div className="flex gap-2 mt-4">
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Search by name to add…" className="flex-1" />
              <Button size="sm" onClick={handleInvite} disabled={inviteMember.isPending}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Organization;
