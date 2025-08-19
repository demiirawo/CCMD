import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, ArrowLeft, ArrowRight, ExternalLink, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface IframeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const IframeDialog = ({ isOpen, onClose, url, title }: IframeDialogProps) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [inputUrl, setInputUrl] = useState(url);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setCurrentUrl(url);
    setInputUrl(url);
    setHasError(false);
  }, [url]);

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const handleNavigate = () => {
    setCurrentUrl(inputUrl);
    setIsLoading(true);
    setHasError(false);
  };

  const handleOpenInNewTab = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm">{title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Browser Controls */}
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.history.back()}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.history.forward()}
              className="p-2"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="p-2"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleOpenInNewTab}
              className="p-2"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          
          {/* URL Bar */}
          <div className="flex items-center gap-2">
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
              placeholder="Enter URL..."
              className="flex-1 text-sm"
            />
            <Button onClick={handleNavigate} size="sm">
              Go
            </Button>
          </div>
        </div>

        <div className="flex-1 px-4 pb-4 min-h-0">
          {hasError ? (
            <div className="w-full h-full border border-border rounded-lg flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Failed to load content</p>
                <div className="space-x-2">
                  <Button onClick={handleRefresh} variant="outline" size="sm">
                    Try Again
                  </Button>
                  <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border border-border rounded-lg"
              title={title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-downloads"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};