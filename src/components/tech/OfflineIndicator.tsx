import { WifiOff, Wifi, CloudUpload, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const OfflineIndicator = () => {
  const { isOnline, pendingCount, syncing, syncQueue } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {!isOnline && (
        <Badge variant="destructive" className="gap-1 text-xs">
          <WifiOff className="h-3 w-3" /> Offline
        </Badge>
      )}
      {pendingCount > 0 && (
        <Badge variant="outline" className="gap-1 text-xs border-warning text-warning">
          {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CloudUpload className="h-3 w-3" />}
          {pendingCount} pending
        </Badge>
      )}
      {isOnline && pendingCount > 0 && !syncing && (
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => syncQueue()}>
          Sync Now
        </Button>
      )}
    </div>
  );
};

export default OfflineIndicator;
