import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface QueuedAction {
  id: string;
  action: string;
  payload: Record<string, any>;
  timestamp: number;
}

const STORAGE_KEY = "dukeos_offline_queue";

const getQueue = (): QueuedAction[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveQueue = (queue: QueuedAction[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

export const useOfflineSync = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getQueue().length);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); syncQueue(); };
    const goOffline = () => { setIsOnline(false); toast.warning("You're offline. Changes will sync when you reconnect.", { duration: 5000 }); };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  const enqueue = useCallback((action: string, payload: Record<string, any>) => {
    const queue = getQueue();
    const entry: QueuedAction = {
      id: crypto.randomUUID(),
      action,
      payload,
      timestamp: Date.now(),
    };
    queue.push(entry);
    saveQueue(queue);
    setPendingCount(queue.length);

    if (navigator.onLine) {
      syncQueue();
    }
  }, []);

  const processAction = async (item: QueuedAction) => {
    switch (item.action) {
      case "start_job": {
        const { error } = await supabase
          .from("jobs")
          .update({ status: "in_progress", started_at: new Date(item.timestamp).toISOString() })
          .eq("id", item.payload.job_id);
        if (error) throw error;
        break;
      }
      case "complete_job": {
        const { error } = await supabase
          .from("jobs")
          .update({ status: "completed", completed_at: new Date(item.timestamp).toISOString() })
          .eq("id", item.payload.job_id);
        if (error) throw error;
        break;
      }
      case "clock_in": {
        const { error } = await supabase.from("time_entries").insert({
          job_id: item.payload.job_id,
          technician_id: item.payload.technician_id,
          clock_in: new Date(item.timestamp).toISOString(),
          notes: item.payload.notes || "Synced from offline",
        });
        if (error) throw error;
        break;
      }
      case "clock_out": {
        const { error } = await supabase
          .from("time_entries")
          .update({ clock_out: new Date(item.timestamp).toISOString(), notes: item.payload.notes })
          .eq("id", item.payload.entry_id);
        if (error) throw error;
        break;
      }
      default:
        console.warn("Unknown offline action:", item.action);
    }

    // Record in sync queue table for audit
    if (user) {
      await supabase.from("offline_sync_queue").insert({
        user_id: user.id,
        action: item.action,
        payload: item.payload,
        synced: true,
        synced_at: new Date().toISOString(),
      });
    }
  };

  const syncQueue = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);

    const queue = getQueue();
    if (queue.length === 0) {
      syncingRef.current = false;
      setSyncing(false);
      return;
    }

    let synced = 0;
    const failed: QueuedAction[] = [];

    for (const item of queue) {
      try {
        await processAction(item);
        synced++;
      } catch (err) {
        console.error("Sync failed for", item.id, err);
        failed.push(item);
      }
    }

    saveQueue(failed);
    setPendingCount(failed.length);

    if (synced > 0) {
      toast.success(`Synced ${synced} offline action${synced > 1 ? "s" : ""}`);
    }
    if (failed.length > 0) {
      toast.error(`${failed.length} action${failed.length > 1 ? "s" : ""} failed to sync`);
    }

    syncingRef.current = false;
    setSyncing(false);
  }, [user]);

  const startJobOffline = useCallback((jobId: string) => {
    enqueue("start_job", { job_id: jobId });
    toast.info("Job started (will sync when online)");
  }, [enqueue]);

  const completeJobOffline = useCallback((jobId: string) => {
    enqueue("complete_job", { job_id: jobId });
    toast.info("Job completed (will sync when online)");
  }, [enqueue]);

  return {
    isOnline,
    pendingCount,
    syncing,
    enqueue,
    syncQueue,
    startJobOffline,
    completeJobOffline,
  };
};
