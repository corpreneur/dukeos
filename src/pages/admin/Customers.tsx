import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format, subDays } from "date-fns";
import { useState } from "react";

const MOCK_FIRST = ["James","Mary","Robert","Patricia","John","Jennifer","Michael","Linda","David","Elizabeth","William","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen","Christopher","Lisa","Daniel","Nancy","Matthew","Betty","Anthony","Margaret","Mark","Sandra","Donald","Ashley","Steven","Dorothy","Paul","Kimberly","Andrew","Emily","Joshua","Donna","Kenneth","Michelle","Kevin","Carol","Brian","Amanda","George","Melissa","Timothy","Deborah","Ronald","Stephanie","Edward","Rebecca","Jason","Sharon","Jeffrey","Laura","Ryan","Cynthia","Jacob","Kathleen","Gary","Amy","Nicholas","Angela","Eric","Shirley","Jonathan","Anna","Stephen","Brenda","Larry","Pamela","Justin","Emma","Scott","Nicole","Brandon","Helen","Benjamin","Samantha","Samuel","Katherine","Raymond","Christine","Gregory","Debra","Frank","Rachel","Alexander","Carolyn","Patrick","Janet","Jack","Catherine","Dennis","Maria","Jerry","Heather","Tyler","Diane","Aaron","Ruth","Jose","Julie","Adam","Olivia","Nathan","Joyce","Henry","Virginia","Peter","Victoria","Zachary","Kelly","Douglas","Lauren","Harold","Christina","Carl","Joan","Arthur","Evelyn","Dylan","Judith","Jordan","Megan","Wayne","Andrea","Alan","Cheryl","Ralph","Hannah","Roy","Jacqueline","Eugene","Martha","Russell","Gloria","Bobby","Teresa"];
const MOCK_LAST = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Gomez","Phillips","Evans","Turner","Diaz","Parker","Cruz","Edwards","Collins","Reyes","Stewart","Morris","Morales","Murphy","Cook","Rogers","Gutierrez","Ortiz","Morgan","Cooper","Peterson","Bailey","Reed","Kelly","Howard","Ramos","Kim","Cox","Ward","Richardson","Watson","Brooks","Chavez","Wood","James","Bennett","Gray","Mendoza","Ruiz","Hughes","Price","Alvarez","Castillo","Sanders","Patel","Myers","Long","Ross","Foster","Jimenez","Powell","Jenkins","Perry","Russell","Sullivan","Bell","Coleman","Butler","Henderson","Barnes","Gonzales","Fisher","Vasquez","Simmons","Graham","Murray","Ford","Castro","Marshall","Owens","Harrison","Fernandez","McDonald","Woods","Washington","Kennedy","Wells","Vargas","Henry","Chen","Freeman","Webb","Tucker","Guzman"];
const MOCK_AREAS = ["919","984","704","336","252","828","910"];
const MOCK_STATUSES = ["active","active","active","active","active","active","active","active","inactive","pending"] as const;

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMockCustomers(realProfiles: any[]) {
  const TARGET = 127;
  const existing = realProfiles.length;
  const mockCount = Math.max(0, TARGET - existing);
  const mocks = [];
  for (let i = 0; i < mockCount; i++) {
    const r = seededRandom(i + 42);
    const r2 = seededRandom(i + 99);
    const r3 = seededRandom(i + 200);
    const first = MOCK_FIRST[Math.floor(r * MOCK_FIRST.length)];
    const last = MOCK_LAST[Math.floor(r2 * MOCK_LAST.length)];
    const area = MOCK_AREAS[Math.floor(r3 * MOCK_AREAS.length)];
    const hasPhone = r3 > 0.25;
    const phone = hasPhone ? `(${area}) ${String(Math.floor(seededRandom(i + 300) * 900 + 100))}-${String(Math.floor(seededRandom(i + 400) * 9000 + 1000))}` : null;
    const daysAgo = Math.floor(seededRandom(i + 500) * 365);
    const status = MOCK_STATUSES[Math.floor(seededRandom(i + 600) * MOCK_STATUSES.length)];
    const dogs = Math.floor(seededRandom(i + 700) * 4) + 1;
    mocks.push({
      id: `mock-${i}`,
      full_name: `${first} ${last}`,
      phone,
      created_at: subDays(new Date(), daysAgo).toISOString(),
      status,
      dogs,
    });
  }
  return mocks;
}

const AdminCustomers = () => {
  const [search, setSearch] = useState("");

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const allCustomers = useMemo(() => {
    const real = (profiles || []).map((p: any) => ({
      ...p,
      status: "active" as const,
      dogs: 1,
    }));
    const mocks = generateMockCustomers(real);
    return [...real, ...mocks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [profiles]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allCustomers;
    const q = search.toLowerCase();
    return allCustomers.filter(c =>
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  }, [allCustomers, search]);

  const activeCount = allCustomers.filter(c => c.status === "active").length;
  const thisMonth = allCustomers.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Customers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {allCustomers.length} total · {activeCount} active · {thisMonth} new this month
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="hidden sm:table-cell">Dogs</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{p.phone || "—"}</TableCell>
                <TableCell className="hidden sm:table-cell">{p.dogs}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={p.status === "active" ? "default" : p.status === "pending" ? "secondary" : "outline"} className="capitalize text-xs">
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCustomers;
