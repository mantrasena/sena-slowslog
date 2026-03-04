import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useRecordView = (storyId: string | undefined) => {
  useEffect(() => {
    if (!storyId) return;

    const record = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // only track logged-in users

      await supabase.rpc("record_story_view", {
        p_story_id: storyId,
        p_viewer_id: user.id,
      });
    };

    record();
  }, [storyId]);
};
