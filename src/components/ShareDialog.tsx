import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Share2, Lock, Code, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ShareDialogProps {
  tableId: string;
  tableName: string;
}

export const ShareDialog = ({ tableId, tableName }: ShareDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [expiryHours, setExpiryHours] = useState(24);
  const [shareLinks, setShareLinks] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateShareLink = async (shareType: 'public' | 'password' | 'embed') => {
    setIsGenerating(true);
    try {
      const payload: any = {
        table_id: tableId,
        share_type: shareType,
        expires_in_hours: expiryHours
      };

      if (shareType === 'password' && password) {
        payload.password = password;
      }

      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: payload
      });

      if (error) throw error;

      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/shared/${data.share_token}`;
      
      setShareLinks(prev => ({ ...prev, [shareType]: shareUrl }));
      
      toast({
        title: "Share link created",
        description: `Your ${shareType} share link has been generated.`
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Error",
        description: "Failed to generate share link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} link copied to clipboard.`
    });
  };

  const generateEmbedCode = (url: string) => {
    return `<iframe src="${url}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share "{tableName}"</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="public" className="gap-2">
              <Eye className="h-4 w-4" />
              Public
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2">
              <Lock className="h-4 w-4" />
              Password
            </TabsTrigger>
            <TabsTrigger value="embed" className="gap-2">
              <Code className="h-4 w-4" />
              Embed
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="public" className="space-y-4">
            <div className="space-y-2">
              <Label>Public Link Settings</Label>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="public-expiry" className="text-sm">Expires in (hours)</Label>
                  <Input 
                    id="public-expiry"
                    type="number" 
                    value={expiryHours} 
                    onChange={(e) => setExpiryHours(parseInt(e.target.value) || 24)}
                    min="1"
                    max="8760"
                  />
                </div>
                <Button 
                  onClick={() => generateShareLink('public')} 
                  disabled={isGenerating}
                >
                  Generate Link
                </Button>
              </div>
            </div>
            
            {shareLinks.public && (
              <div className="space-y-2">
                <Label>Share URL</Label>
                <div className="flex gap-2">
                  <Input value={shareLinks.public} readOnly className="flex-1" />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => copyToClipboard(shareLinks.public, 'Public')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="password" className="space-y-4">
            <div className="space-y-2">
              <Label>Password Protected Link</Label>
              <div className="space-y-3">
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter password for protection"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="password-expiry" className="text-sm">Expires in (hours)</Label>
                    <Input 
                      id="password-expiry"
                      type="number" 
                      value={expiryHours} 
                      onChange={(e) => setExpiryHours(parseInt(e.target.value) || 24)}
                      min="1"
                      max="8760"
                    />
                  </div>
                  <Button 
                    onClick={() => generateShareLink('password')} 
                    disabled={!password || isGenerating}
                  >
                    Generate Link
                  </Button>
                </div>
              </div>
            </div>
            
            {shareLinks.password && (
              <div className="space-y-2">
                <Label>Password Protected URL</Label>
                <div className="flex gap-2">
                  <Input value={shareLinks.password} readOnly className="flex-1" />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => copyToClipboard(shareLinks.password, 'Password protected')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Users will need to enter the password to access this table.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="embed" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Embed URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={`${window.location.origin}/public/${tableId}?embed=true`}
                    readOnly 
                    className="flex-1" 
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => copyToClipboard(`${window.location.origin}/public/${tableId}?embed=true`, 'Embed URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Embed Code</Label>
                <div className="relative">
                  <textarea 
                    className="w-full h-20 p-3 text-sm font-mono bg-muted rounded-md resize-none"
                    value={generateEmbedCode(`${window.location.origin}/public/${tableId}?embed=true`)}
                    readOnly
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generateEmbedCode(`${window.location.origin}/public/${tableId}?embed=true`), 'Embed code')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                This iframe will always show the latest version of your table. No expiration.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};