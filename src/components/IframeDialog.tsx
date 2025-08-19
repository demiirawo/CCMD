import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface IframeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const IframeDialog = ({ isOpen, onClose, url, title }: IframeDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6">
          <iframe
            src={url}
            className="w-full h-full border-0 rounded-lg"
            title={title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};