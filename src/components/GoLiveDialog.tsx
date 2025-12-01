import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { LivestreamBroadcaster } from "./LivestreamBroadcaster";

interface GoLiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLiveStarted?: () => void;
}

interface LivestreamData {
  livestreamId: string;
  callId: string;
  apiKey: string;
  token: string;
}

export const GoLiveDialog = ({ open, onOpenChange, onLiveStarted }: GoLiveDialogProps) => {
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [livestreamData, setLivestreamData] = useState<LivestreamData | null>(null);
  const [userId, setUserId] = useState<string>("");

  const handleGoLive = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your livestream");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to go live");
        return;
      }

      const { data, error } = await supabase.functions.invoke('start-livestream', {
        body: { title: title.trim() }
      });

      if (error) throw error;

      console.log("Livestream response:", data);

      setLivestreamData({
        livestreamId: data.livestream.id,
        callId: data.callId,
        apiKey: data.streamApiKey,
        token: data.token,
      });
      setUserId(user.id);
      
      toast.success("Starting your livestream...");
      onLiveStarted?.();
    } catch (error) {
      console.error('Error starting livestream:', error);
      toast.error("Failed to start livestream");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopStream = () => {
    setLivestreamData(null);
    setTitle("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open && !livestreamData) {
        setTitle("");
      }
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {livestreamData ? "You're Live!" : "Start Livestream"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {!livestreamData ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="livestream-title">Livestream Title</Label>
                <Input
                  id="livestream-title"
                  placeholder="Enter your livestream title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button 
                onClick={handleGoLive} 
                disabled={isLoading || !title.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Go Live"
                )}
              </Button>
            </>
          ) : (
            <LivestreamBroadcaster
              livestreamId={livestreamData.livestreamId}
              callId={livestreamData.callId}
              apiKey={livestreamData.apiKey}
              token={livestreamData.token}
              userId={userId}
              onStop={handleStopStream}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
