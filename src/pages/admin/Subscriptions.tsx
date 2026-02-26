import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminSubscriptions = () => {
  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, service_addresses(street, city)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">All Subscriptions</h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions?.map((sub: any) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium capitalize">{sub.plan}</TableCell>
                <TableCell className="capitalize">{sub.frequency}</TableCell>
                <TableCell>${(sub.price_cents / 100).toFixed(2)}</TableCell>
                <TableCell>{sub.service_addresses?.street}, {sub.service_addresses?.city}</TableCell>
                <TableCell>
                  <Badge variant={sub.active ? "default" : "secondary"}>
                    {sub.active ? "Active" : "Cancelled"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
