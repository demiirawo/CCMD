import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EnhancedIframe } from "./EnhancedIframe";

interface IframeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const IframeDialog = ({ isOpen, onClose, url, title }: IframeDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[98vw] h-[98vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 h-full">
          <EnhancedIframe 
            url={url} 
            title={title} 
            height="calc(98vh - 120px)" 
            allowUserToggle={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};