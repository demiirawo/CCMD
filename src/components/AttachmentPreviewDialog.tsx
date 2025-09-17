import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Upload, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AttachmentPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: string[];
  onUpdate: (newAttachments: string[]) => void;
  fieldName: string;
}

export const AttachmentPreviewDialog = ({
  isOpen,
  onClose,
  attachments,
  onUpdate,
  fieldName
}: AttachmentPreviewDialogProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { profile } = useAuth();
  const { toast } = useToast();

  const currentAttachment = attachments[selectedIndex];
  const fileName = currentAttachment?.split('/').pop() || 'file';
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
  const isPdf = /\.pdf$/i.test(fileName);
  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(fileName);
  const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(fileName);

  const handleFileUpload = async (files: FileList) => {
    try {
      const newUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${profile?.company_id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('base-attachments')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('base-attachments')
          .getPublicUrl(filePath);
        
        newUrls.push(publicUrl);
      }
      
      const updatedAttachments = [...attachments, ...newUrls];
      onUpdate(updatedAttachments);
      
      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFile = () => {
    const updatedAttachments = attachments.filter((_, index) => index !== selectedIndex);
    onUpdate(updatedAttachments);
    
    if (selectedIndex >= updatedAttachments.length) {
      setSelectedIndex(Math.max(0, updatedAttachments.length - 1));
    }
    
    toast({
      title: "Success",
      description: "File removed"
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentAttachment;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFilePreview = () => {
    if (!currentAttachment) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted/30 rounded border-2 border-dashed border-muted-foreground/30">
          <p className="text-muted-foreground">No files attached</p>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted/30 rounded overflow-hidden">
          <img 
            src={currentAttachment} 
            alt={fileName}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="h-96 bg-muted/30 rounded overflow-hidden">
          <iframe 
            src={currentAttachment}
            className="w-full h-full border-0"
            title={fileName}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted/30 rounded overflow-hidden">
          <video 
            src={currentAttachment} 
            controls
            className="max-h-full max-w-full"
          />
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted/30 rounded">
          <audio 
            src={currentAttachment} 
            controls
            className="w-full max-w-md"
          />
        </div>
      );
    }

    // Default preview for other file types
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded">
        <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
          <span className="text-2xl">📎</span>
        </div>
        <p className="font-medium">{fileName}</p>
        <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{fieldName} - Attachments</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-full">
          {/* File list sidebar */}
          <div className="w-64 border-r pr-4">
            <div className="mb-4">
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files);
                  }
                }}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" size="sm" className="w-full cursor-pointer" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Add Files
                  </span>
                </Button>
              </label>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {attachments.map((attachment, index) => {
                const name = attachment.split('/').pop() || 'file';
                const isCurrentImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
                
                return (
                  <div
                    key={index}
                    className={`p-2 rounded cursor-pointer border transition-colors ${
                      selectedIndex === index ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center gap-2">
                      {isCurrentImage ? (
                        <img 
                          src={attachment} 
                          alt={name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs">📎</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{name}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Preview area */}
          <div className="flex-1">
            {renderFilePreview()}
            
            {currentAttachment && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div>
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedIndex + 1} of {attachments.length}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRemoveFile}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};