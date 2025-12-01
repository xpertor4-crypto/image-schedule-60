import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LivestreamViewer } from "./LivestreamViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface LivestreamViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  livestreamId: string;
  title: string;
}

export const LivestreamViewDialog = ({ 
  open, 
  onOpenChange, 
  livestreamId,
  title 
}: LivestreamViewDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [streamData, setStreamData] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    if (open && livestreamId) {
      fetchStreamData();
    }
  }, [open, livestreamId]);

  const fetchStreamData = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to view livestreams");
        return;
      }

      setUserId(user.id);

      // Fetch livestream details
      const { data: livestream, error: lsError } = await supabase
        .from("livestream")
        .select("*")
        .eq("id", livestreamId)
        .single();

      if (lsError) throw lsError;

      if (livestream.status !== "active") {
        toast.error("This livestream has ended");
        onOpenChange(false);
        return;
      }

      // Generate viewer token (in production, this should be done via edge function)
      const { data, error } = await supabase.functions.invoke('start-livestream', {
        body: { title: "viewer" }
      });

      if (error) throw error;

      setStreamData({
        callId: livestream.stream_call_id,
        apiKey: data.streamApiKey,
        token: data.token,
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching stream data:", error);
      toast.error("Failed to load livestream");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : streamData ? (
            <LivestreamViewer
              callId={streamData.callId}
              apiKey={streamData.apiKey}
              token={streamData.token}
              userId={userId}
            />
          ) : (
            <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
              <p>Failed to load livestream</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
