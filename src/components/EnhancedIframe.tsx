import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { processUrl } from "@/utils/urlProcessor";
import { cn } from "@/lib/utils";

interface EnhancedIframeProps {
  url: string;
  title: string;
  className?: string;
  height?: string;
  allowUserToggle?: boolean;
}

export const EnhancedIframe = ({ 
  url, 
  title, 
  className, 
  height = "400px",
  allowUserToggle = true 
}: EnhancedIframeProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedMode, setEmbedMode] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const processedUrl = processUrl(url);

  useEffect(() => {
    if (processedUrl.isValid && embedMode) {
      setLoading(true);
      setError(null);
      
      // Set a timeout for loading
      timeoutRef.current = setTimeout(() => {
        setError("Content is taking too long to load");
        setLoading(false);
      }, 10000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [processedUrl.processed, embedMode, loadAttempt]);

  const handleIframeLoad = () => {
    console.log('✅ Enhanced Iframe: Successfully loaded:', processedUrl.processed);
    setLoading(false);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleIframeError = () => {
    console.error('❌ Enhanced Iframe: Failed to load:', processedUrl.processed);
    setLoading(false);
    setError("Failed to load embedded content");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const retryLoad = () => {
    setLoadAttempt(prev => prev + 1);
  };

  const openInNewTab = () => {
    window.open(processedUrl.processed, '_blank', 'noopener,noreferrer');
  };

  if (!processedUrl.isValid) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Invalid URL: {processedUrl.errors.join(', ')}
        </AlertDescription>
      </Alert>
    );
  }

  if (!embedMode) {
    return (
      <div className="flex flex-col gap-2 p-4 border border-border rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">External Link: {title}</span>
          {allowUserToggle && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setEmbedMode(true)}
            >
              Try Embed Again
            </Button>
          )}
        </div>
        <Button onClick={openInNewTab} variant="outline" className="w-fit">
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in New Tab
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading content...</span>
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={retryLoad}>
                Retry
              </Button>
              <Button variant="ghost" size="sm" onClick={openInNewTab}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Open Link
              </Button>
              {allowUserToggle && (
                <Button variant="ghost" size="sm" onClick={() => setEmbedMode(false)}>
                  Switch to Link
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-muted-foreground">
          {processedUrl.type === 'airtable' ? 'Airtable Embed' : 'External Content'}
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={openInNewTab}>
            <ExternalLink className="h-3 w-3" />
          </Button>
          {allowUserToggle && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setEmbedMode(false)}
            >
              Link Mode
            </Button>
          )}
        </div>
      </div>

      <iframe
        ref={iframeRef}
        key={`${processedUrl.processed}-${loadAttempt}`}
        src={processedUrl.processed}
        title={title}
        style={{ height }}
        className="w-full border border-border rounded-lg"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
        loading="lazy"
      />
    </div>
  );
};