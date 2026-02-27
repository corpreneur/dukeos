import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const PushNotificationToggle = () => {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <Button
      variant={isSubscribed ? "default" : "outline"}
      size="sm"
      className="gap-2"
      disabled={isLoading}
      onClick={isSubscribed ? unsubscribe : subscribe}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {isSubscribed ? "Push On" : "Enable Push"}
    </Button>
  );
};

export default PushNotificationToggle;
