import { useEffect, useState } from "react";
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  StreamCall,
  LivestreamPlayer,
  StreamTheme,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, StopCircle } from "lucide-react";

interface LivestreamBroadcasterProps {
  livestreamId: string;
  callId: string;
  apiKey: string;
  token: string;
  userId: string;
  onStop: () => void;
}

export const LivestreamBroadcaster = ({
  livestreamId,
  callId,
  apiKey,
  token,
  userId,
  onStop,
}: LivestreamBroadcasterProps) => {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initStream = async () => {
      try {
        console.log("Initializing Stream client with:", { apiKey, userId, callId });

        const streamClient = new StreamVideoClient({
          apiKey,
          user: { id: userId },
          token,
        });

        setClient(streamClient);

        const streamCall = streamClient.call("livestream", callId);
        await streamCall.join({ create: true });
        
        // Start broadcasting
        await streamCall.camera.enable();
        await streamCall.microphone.enable();
        
        setCall(streamCall);
        setIsLive(true);
        setIsLoading(false);

        console.log("Stream started successfully");
      } catch (error) {
        console.error("Error initializing stream:", error);
        toast.error("Failed to start livestream");
        setIsLoading(false);
      }
    };

    initStream();

    return () => {
      if (call) {
        call.leave().catch(console.error);
      }
      if (client) {
        client.disconnectUser().catch(console.error);
      }
    };
  }, [apiKey, token, userId, callId]);

  const handleStopStream = async () => {
    try {
      setIsLoading(true);

      // Stop the stream
      if (call) {
        await call.endCall();
        await call.leave();
      }

      // Update database
      const { error } = await supabase.functions.invoke("stop-livestream", {
        body: { livestreamId },
      });

      if (error) throw error;

      toast.success("Livestream ended");
      onStop();
    } catch (error) {
      console.error("Error stopping stream:", error);
      toast.error("Failed to stop livestream");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!client || !call || !isLive) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <p>Failed to start livestream</p>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamTheme>
        <StreamCall call={call}>
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <LivestreamPlayer callType="livestream" callId={callId} />
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
            </div>
            <Button
              onClick={handleStopStream}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ending Stream...
                </>
              ) : (
                <>
                  <StopCircle className="w-4 h-4 mr-2" />
                  End Livestream
                </>
              )}
            </Button>
          </div>
        </StreamCall>
      </StreamTheme>
    </StreamVideo>
  );
};
