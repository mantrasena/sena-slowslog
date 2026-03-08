import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const COOLDOWN_DAYS = 6;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export const usePublishCooldown = () => {
  const { user, isFounder } = useAuth();

  return useQuery({
    queryKey: ["publish-cooldown", user?.id],
    enabled: !!user && !isFounder,
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("published_at")
        .eq("user_id", user!.id)
        .eq("is_draft", false)
        .order("published_at", { ascending: false })
        .limit(1);

      if (!data?.length || !data[0].published_at) {
        return { canPublish: true, nextPublishAt: null, daysLeft: 0, hoursLeft: 0 };
      }

      const lastPublished = new Date(data[0].published_at).getTime();
      const nextPublish = lastPublished + COOLDOWN_MS;
      const now = Date.now();

      if (now >= nextPublish) {
        return { canPublish: true, nextPublishAt: null, daysLeft: 0, hoursLeft: 0 };
      }

      const remaining = nextPublish - now;
      const daysLeft = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      return {
        canPublish: false,
        nextPublishAt: new Date(nextPublish),
        daysLeft,
        hoursLeft,
      };
    },
  });
};
