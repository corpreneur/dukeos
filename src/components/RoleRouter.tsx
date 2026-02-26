import { useUserRole } from "@/hooks/useUserRole";

interface RoleRouterProps {
  admin: React.ReactNode;
  technician: React.ReactNode;
  customer: React.ReactNode;
}

const RoleRouter = ({ admin, technician, customer }: RoleRouterProps) => {
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (role === "admin" || role === "manager") return <>{admin}</>;
  if (role === "technician") return <>{technician}</>;
  return <>{customer}</>;
};

export default RoleRouter;
