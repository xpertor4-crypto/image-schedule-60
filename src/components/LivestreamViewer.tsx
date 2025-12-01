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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LivestreamViewerProps {
  callId: string;
  apiKey: string;
  token: string;
  userId: string;
}

export const LivestreamViewer = ({
  callId,
  apiKey,
  token,
  userId,
}: LivestreamViewerProps) => {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initStream = async () => {
      try {
        console.log("Joining stream as viewer:", { apiKey, userId, callId });

        const streamClient = new StreamVideoClient({
          apiKey,
          user: { id: userId },
          token,
        });

        setClient(streamClient);

        const streamCall = streamClient.call("livestream", callId);
        await streamCall.join();

        setCall(streamCall);
        setIsLoading(false);

        console.log("Joined stream successfully");
      } catch (error) {
        console.error("Error joining stream:", error);
        toast.error("Failed to join livestream");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <p>Stream not available</p>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamTheme>
        <StreamCall call={call}>
          <div className="relative rounded-lg overflow-hidden bg-black">
            <LivestreamPlayer callType="livestream" callId={callId} />
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </div>
          </div>
        </StreamCall>
      </StreamTheme>
    </StreamVideo>
  );
};
