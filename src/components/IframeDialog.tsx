import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface IframeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const IframeDialog = ({ isOpen, onClose, url, title }: IframeDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            External content displayed in iframe
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0">
          <iframe
            src={url}
            className="w-full h-full border border-border rounded-lg"
            title={title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            loading="lazy"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};