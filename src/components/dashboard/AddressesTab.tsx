import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";

interface AddressForm {
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

const emptyForm: AddressForm = { label: "Home", street: "", city: "", state: "NC", zip: "" };

const AddressesTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["customer-addresses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_addresses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: AddressForm) => {
      if (editId) {
        const { error } = await supabase
          .from("service_addresses")
          .update(data)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("service_addresses")
          .insert({ ...data, customer_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
      toast.success(editId ? "Address updated" : "Address added");
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
      toast.success("Address deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setOpen(false);
  };

  const openEdit = (addr: any) => {
    setForm({ label: addr.label, street: addr.street, city: addr.city, state: addr.state, zip: addr.zip });
    setEditId(addr.id);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const updateField = (field: keyof AddressForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Service Addresses</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage where we mow</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editId ? "Edit Address" : "New Address"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={form.label} onChange={(e) => updateField("label", e.target.value)} placeholder="Home" required />
              </div>
              <div className="space-y-2">
                <Label>Street</Label>
                <Input value={form.street} onChange={(e) => updateField("street", e.target.value)} placeholder="123 Main St" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Durham" required />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={form.state} onChange={(e) => updateField("state", e.target.value)} placeholder="NC" required />
                </div>
                <div className="space-y-2">
                  <Label>ZIP</Label>
                  <Input value={form.zip} onChange={(e) => updateField("zip", e.target.value)} placeholder="27701" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Add Address"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!addresses?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground">No addresses</h3>
            <p className="text-sm text-muted-foreground mt-1">Add a service address to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr: any) => (
            <Card key={addr.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-display font-semibold text-foreground">{addr.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {addr.street}<br />
                      {addr.city}, {addr.state} {addr.zip}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(addr)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(addr.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesTab;
