import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export interface SubsectionMetadata {
  accountableOwner?: string;
  link?: string;
  linkText?: string;
  linkIsIframe?: boolean;
  link2?: string;
  link2Text?: string;
  link2IsIframe?: boolean;
  description?: string;
  updated?: string;
}

interface SubsectionMetadataDialogProps {
  children: React.ReactNode;
  title: string;
  metadata?: SubsectionMetadata;
  attendees: string[];
  onSave: (metadata: SubsectionMetadata) => void;
}

export const SubsectionMetadataDialog = ({
  children,
  title,
  metadata = {},
  attendees,
  onSave
}: SubsectionMetadataDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [accountableOwner, setAccountableOwner] = useState(metadata.accountableOwner || "");
  const [link, setLink] = useState(metadata.link || "");
  const [linkText, setLinkText] = useState(metadata.linkText || "");
  const [linkIsIframe, setLinkIsIframe] = useState(metadata.linkIsIframe || false);
  const [link2, setLink2] = useState(metadata.link2 || "");
  const [link2Text, setLink2Text] = useState(metadata.link2Text || "");
  const [link2IsIframe, setLink2IsIframe] = useState(metadata.link2IsIframe || false);
  const [description, setDescription] = useState(metadata.description || "");

  const extractUrl = (input: string): string => {
    if (!input) return '';
    
    // If input looks like iframe HTML, extract src URL
    const iframeMatch = input.match(/src="([^"]+)"/);
    if (iframeMatch) {
      return iframeMatch[1];
    }
    
    // Clean the URL and add protocol if missing
    let url = input.trim();
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    return url;
  };

  const handleSave = () => {
    const newMetadata: SubsectionMetadata = {
      accountableOwner: accountableOwner || undefined,
      link: extractUrl(link) || undefined,
      linkText: linkText || undefined,
      linkIsIframe: linkIsIframe || undefined,
      link2: extractUrl(link2) || undefined,
      link2Text: link2Text || undefined,
      link2IsIframe: link2IsIframe || undefined,
      description: description || undefined,
      updated: new Date().toLocaleDateString('en-GB')
    };
    onSave(newMetadata);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {title} Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountable-owner">Accountable Owner</Label>
            <Select value={accountableOwner} onValueChange={setAccountableOwner}>
              <SelectTrigger>
                <SelectValue placeholder="Select from meeting attendees..." />
              </SelectTrigger>
              <SelectContent>
                {attendees.map(attendee => (
                  <SelectItem key={attendee} value={attendee}>
                    {attendee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Link 1</Label>
            <div className="flex gap-2">
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Enter link URL..."
                className="flex-1"
              />
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text (optional)"
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="link-iframe"
                checked={linkIsIframe}
                onCheckedChange={(checked) => setLinkIsIframe(checked === true)}
              />
              <Label htmlFor="link-iframe" className="text-sm">Display as iframe popup</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Link 2</Label>
            <div className="flex gap-2">
              <Input
                value={link2}
                onChange={(e) => setLink2(e.target.value)}
                placeholder="Enter link URL..."
                className="flex-1"
              />
              <Input
                value={link2Text}
                onChange={(e) => setLink2Text(e.target.value)}
                placeholder="Link text (optional)"
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="link2-iframe"
                checked={link2IsIframe}
                onCheckedChange={(checked) => setLink2IsIframe(checked === true)}
              />
              <Label htmlFor="link2-iframe" className="text-sm">Display as iframe popup</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Note</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};