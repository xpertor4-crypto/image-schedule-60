import { useState, useEffect, useRef } from "react";
import { Send, Settings, Paperclip, X, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CoachSelector from "@/components/CoachSelector";
import imageCompression from "browser-image-compression";

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  id?: string;
  content_type?: "text" | "image" | "video" | "link";
  media_url?: string;
  link_metadata?: LinkMetadata;
}

const Chat = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState<string>();
  const [selectedCoachName, setSelectedCoachName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [userId, setUserId] = useState<string>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    } else {
      setUserId(user.id);
    }
  };

  const handleSelectCoach = async (coachId: string, coachName: string) => {
    setSelectedCoachId(coachId);
    setSelectedCoachName(coachName);
    
    if (!userId) return;
    
    try {
      // Find existing conversation with this specific coach
      const { data: conversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);
      
      let convId: string | undefined;
      
      // Check if any of these conversations include the selected coach
      if (conversations && conversations.length > 0) {
        for (const conv of conversations) {
          const { data: coachInConv } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', conv.conversation_id)
            .eq('user_id', coachId)
            .maybeSingle();
          
          if (coachInConv) {
            convId = conv.conversation_id;
            break;
          }
        }
      }
      
      // Create new conversation if none exists
      if (!convId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single();
        
        if (convError) throw convError;
        
        convId = newConv.id;
        
        // Add both participants
        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: convId, user_id: userId },
            { conversation_id: convId, user_id: coachId }
          ]);
        
        if (participantsError) throw participantsError;
      }
      
      setConversationId(convId);
      
      // Load existing messages for this conversation
      const { data: existingMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, content_type, media_url, link_metadata')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      
      // Format and set messages with new fields
      const formattedMessages: Message[] = (existingMessages || []).map((msg: any) => ({
        id: msg.id,
        role: msg.sender_id === userId ? "user" : "assistant",
        content: msg.content,
        content_type: msg.content_type || 'text',
        media_url: msg.media_url,
        link_metadata: msg.link_metadata
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
      setMessages([]);
    }
  };

  const detectLinks = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 100MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast({
        title: "Invalid file type",
        description: "Please select an image or video file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!userId) throw new Error("User not authenticated");

    let fileToUpload = file;

    // Compress video if needed
    if (file.type.startsWith("video/")) {
      toast({
        title: "Processing video",
        description: "Compressing video...",
      });
      // For videos, we'll upload as-is since browser-image-compression is for images
      // In production, you'd want server-side video compression
    } else if (file.type.startsWith("image/")) {
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      try {
        fileToUpload = await imageCompression(file, options);
      } catch (error) {
        console.error("Error compressing image:", error);
      }
    }

    const fileExt = fileToUpload.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-media")
      .upload(fileName, fileToUpload);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("chat-media")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const streamChat = async (userMessage: string, fileUrl?: string, fileType?: string) => {
    // Detect links in message
    const links = detectLinks(userMessage);
    let contentType: Message["content_type"] = "text";
    let linkMetadata: LinkMetadata | undefined;

    if (fileUrl) {
      contentType = fileType === "image" ? "image" : "video";
    } else if (links.length > 0) {
      const firstLink = links[0];
      const youtubeId = extractYouTubeId(firstLink);
      
      if (youtubeId) {
        linkMetadata = {
          url: firstLink,
          title: "YouTube Video",
          image: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        };
        contentType = "link";
      } else {
        linkMetadata = {
          url: firstLink,
        };
        contentType = "link";
      }
    }

    // Save user message to database
    if (conversationId && userId) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: userMessage,
        content_type: contentType,
        media_url: fileUrl,
        link_metadata: linkMetadata as any,
      });
    }

    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      content_type: contentType,
      media_url: fileUrl,
      link_metadata: linkMetadata,
    };
    
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: newMessages,
          coachName: selectedCoachName,
          conversationId,
          coachId: selectedCoachId
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Request failed: ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      // Add initial assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch { /* ignore */ }
        }
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      // Remove the assistant message if it failed
      setMessages(prev => prev.filter((_, idx) => idx !== prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || !selectedCoachId || isLoading || !conversationId) return;

    const messageText = input;
    setInput("");
    
    let fileUrl: string | undefined;
    let fileType: string | undefined;

    // Upload file if selected
    if (selectedFile) {
      try {
        fileUrl = await uploadFile(selectedFile);
        fileType = selectedFile.type.startsWith("image/") ? "image" : "video";
        setSelectedFile(null);
        setFilePreview(null);
      } catch (error) {
        console.error("Error uploading file:", error);
        toast({
          title: "Upload failed",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    await streamChat(messageText, fileUrl, fileType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CoachSelector 
              onSelectCoach={handleSelectCoach}
              selectedCoachId={selectedCoachId}
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {selectedCoachName ? `Chat with ${selectedCoachName}` : 'Coach Chat'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectedCoachName ? 'Your personal AI coach' : 'Select a coach to start chatting'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            className="shrink-0"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="h-[calc(100vh-180px)]" ref={scrollRef}>
        <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
          {!selectedCoachId ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                Select a coach from the top left to start chatting
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {message.content_type === "image" && message.media_url && (
                    <img
                      src={message.media_url}
                      alt="Shared image"
                      className="rounded-lg mb-2 max-w-full h-auto"
                    />
                  )}
                  {message.content_type === "video" && message.media_url && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                      <video
                        src={message.media_url}
                        controls
                        className="w-full max-h-96"
                      />
                    </div>
                  )}
                  {message.content_type === "link" && message.link_metadata && (
                    <a
                      href={message.link_metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mb-2 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
                    >
                      {message.link_metadata.image && (
                        <img
                          src={message.link_metadata.image}
                          alt={message.link_metadata.title || "Link preview"}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-3 bg-background/50">
                        {message.link_metadata.title && (
                          <p className="font-semibold text-sm">
                            {message.link_metadata.title}
                          </p>
                        )}
                        {message.link_metadata.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.link_metadata.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {message.link_metadata.url}
                        </p>
                      </div>
                    </a>
                  )}
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-secondary-foreground rounded-2xl px-4 py-3">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 bg-background border-t border-border">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          {selectedFile && filePreview && (
            <div className="mb-3 relative inline-block">
              <div className="relative rounded-lg overflow-hidden border border-border">
                {selectedFile.type.startsWith("image/") ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-h-32 max-w-xs object-cover"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted">
                    <Video className="h-8 w-8" />
                    <span className="text-sm">{selectedFile.name}</span>
                  </div>
                )}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedCoachId || isLoading}
              className="shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={selectedCoachId ? "Type your message..." : "Select a coach first..."}
              className="flex-1"
              disabled={!selectedCoachId || isLoading}
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              className="shrink-0"
              disabled={!selectedCoachId || isLoading || (!input.trim() && !selectedFile)}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;