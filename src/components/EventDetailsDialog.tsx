import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Tag, Image as ImageIcon, CheckCircle2, XCircle, Upload } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  type: "visit" | "appointment" | "activity";
  startTime: string;
  endTime: string;
  date: Date;
  description?: string;
  imageUrl?: string;
  category?: string;
  status?: string;
  evidenceUrl?: string;
  completedAt?: string;
}

interface EventDetailsDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: () => void;
}

const eventTypeConfig = {
  visit: {
    color: "bg-event-visit text-event-visit-light",
    label: "Visit"
  },
  appointment: {
    color: "bg-event-appointment text-event-appointment-light",
    label: "Appointment"
  },
  activity: {
    color: "bg-event-activity text-event-activity-light",
    label: "Activity"
  }
};

export const EventDetailsDialog = ({ event, open, onOpenChange, onStatusUpdate }: EventDetailsDialogProps) => {
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  if (!event) return null;

  const typeConfig = eventTypeConfig[event.type];

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq("id", event.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Task marked as ${newStatus === 'completed' ? 'completed' : 'not completed'}.`,
      });

      if (newStatus === 'completed') {
        setShowEvidenceDialog(true);
      } else {
        onStatusUpdate?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleEvidenceUpload = async () => {
    if (!selectedFile) {
      onStatusUpdate?.();
      setShowEvidenceDialog(false);
      onOpenChange(false);
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${event.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("task-evidence")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("task-evidence")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("events")
        .update({ evidence_url: publicUrl })
        .eq("id", event.id);

      if (updateError) throw updateError;

      toast({
        title: "Evidence Uploaded",
        description: "Your task completion evidence has been saved.",
      });

      onStatusUpdate?.();
      setShowEvidenceDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading evidence:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload evidence. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <>
      <Dialog open={open && !showEvidenceDialog} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-2xl font-bold pr-8">{event.title}</DialogTitle>
              <Badge className={typeConfig.color}>
                {typeConfig.label}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
          {/* Image Section */}
          {event.imageUrl ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted animate-fade-in">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Event Details */}
          <div className="space-y-4">
            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="p-2 rounded-md bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Date</div>
                  <div className="text-sm font-semibold">
                    {format(event.date, "EEEE, MMMM d, yyyy")}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="p-2 rounded-md bg-primary/10">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Time</div>
                  <div className="text-sm font-semibold">
                    {event.startTime} - {event.endTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Category */}
            {event.category && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="p-2 rounded-md bg-primary/10">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Category</div>
                  <div className="text-sm font-semibold capitalize">{event.category}</div>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                <div className="text-sm font-semibold text-muted-foreground">Description</div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Placeholder if no description */}
            {!event.description && (
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-sm text-muted-foreground italic">
                  No description available
                </p>
              </div>
            )}

            {/* Status Display */}
            {event.status && event.status !== 'pending' && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                <div className={`p-2 rounded-md ${event.status === 'completed' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {event.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground font-medium">Status</div>
                  <div className="text-sm font-semibold capitalize">{event.status.replace('_', ' ')}</div>
                  {event.completedAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Completed on {format(new Date(event.completedAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Evidence Display */}
            {event.evidenceUrl && (
              <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                <div className="text-sm font-semibold text-muted-foreground">Task Evidence</div>
                <a 
                  href={event.evidenceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  View uploaded evidence
                </a>
              </div>
            )}

            {/* Task Completion Buttons */}
            {event.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleStatusUpdate('completed')}
                  className="flex-1 gap-2"
                  variant="default"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Completed
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('not_completed')}
                  className="flex-1 gap-2"
                  variant="outline"
                >
                  <XCircle className="w-4 h-4" />
                  Not Completed
                </Button>
              </div>
            )}
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Evidence Upload Dialog */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Provide Evidence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Do you want to provide evidence that this task has been completed?
            </p>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                📸 Evidence helps boost your rating and helps us communicate with you better.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Evidence (Optional)</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleEvidenceUpload}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? "Uploading..." : selectedFile ? "Upload & Finish" : "Skip"}
            </Button>
            <Button
              onClick={() => {
                setShowEvidenceDialog(false);
                setSelectedFile(null);
                onStatusUpdate?.();
                onOpenChange(false);
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
