import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { processUrl } from "@/utils/urlProcessor";
import { TableSelector } from "./TableSelector";

export interface SubsectionMetadata {
  customTitle?: string;
  accountableOwner?: string;
  link?: string;
  linkText?: string;
  linkIsIframe?: boolean;
  link2?: string;
  link2Text?: string;
  link2IsIframe?: boolean;
  link3?: string;
  link3Text?: string;
  link3IsIframe?: boolean;
  link4?: string;
  link4Text?: string;
  link4IsIframe?: boolean;
  description?: string;
  updated?: string;
  linkedEvidenceRefs?: string[];
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
  const [customTitle, setCustomTitle] = useState(metadata.customTitle || "");
  const [accountableOwner, setAccountableOwner] = useState(metadata.accountableOwner || "");
  const [link, setLink] = useState(metadata.link || "");
  const [linkText, setLinkText] = useState(metadata.linkText || "");
  const [linkIsIframe, setLinkIsIframe] = useState(metadata.linkIsIframe || false);
  const [link2, setLink2] = useState(metadata.link2 || "");
  const [link2Text, setLink2Text] = useState(metadata.link2Text || "");
  const [link2IsIframe, setLink2IsIframe] = useState(metadata.link2IsIframe || false);
  const [link3, setLink3] = useState(metadata.link3 || "");
  const [link3Text, setLink3Text] = useState(metadata.link3Text || "");
  const [link3IsIframe, setLink3IsIframe] = useState(metadata.link3IsIframe || false);
  const [link4, setLink4] = useState(metadata.link4 || "");
  const [link4Text, setLink4Text] = useState(metadata.link4Text || "");
  const [link4IsIframe, setLink4IsIframe] = useState(metadata.link4IsIframe || false);
  const [description, setDescription] = useState(metadata.description || "");

  const processAndDetectIframe = (input: string): { url: string; isIframe: boolean } => {
    if (!input) return { url: '', isIframe: false };
    
    const processed = processUrl(input);
    const shouldBeIframe = processed.type === 'airtable' || 
                          input.includes('embed') || 
                          input.includes('iframe') ||
                          processed.processed.includes('embed');
    
    return {
      url: processed.processed,
      isIframe: processed.isValid && shouldBeIframe
    };
  };

  const handleSave = () => {
    const link1Result = processAndDetectIframe(link);
    const link2Result = processAndDetectIframe(link2);
    
    // For link3 and link4, if they are table IDs, convert to full public table URLs
    const baseUrl = window.location.origin;
    const link3Url = link3 ? `${baseUrl}/public/${link3}?embed=true` : '';
    const link4Url = link4 ? `${baseUrl}/public/${link4}?embed=true` : '';
    
    const newMetadata: SubsectionMetadata = {
      customTitle: customTitle.trim() || undefined,
      accountableOwner: accountableOwner || undefined,
      link: link1Result.url || undefined,
      linkText: linkText || undefined,
      linkIsIframe: linkIsIframe,
      link2: link2Result.url || undefined,
      link2Text: link2Text || undefined,
      link2IsIframe: link2IsIframe,
      link3: link3Url || undefined,
      link3Text: link3Text || undefined,
      link3IsIframe: !!link3, // Always true if table is selected
      link4: link4Url || undefined,
      link4Text: link4Text || undefined,
      link4IsIframe: !!link4, // Always true if table is selected
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
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit {title} Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-title">Custom Title (Optional)</Label>
            <Input
              id="custom-title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={title}
              className="bg-white"
            />
            <p className="text-xs text-muted-foreground">Leave empty to use the default title: "{title}"</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountable-owner">Accountable Owner</Label>
            <Select value={accountableOwner} onValueChange={setAccountableOwner}>
              <SelectTrigger className="bg-white">
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
            <div className="flex gap-2 items-center">
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link description (optional)"
                className="flex-1 bg-white"
              />
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Enter link URL..."
                className="flex-1 bg-white"
              />
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <Checkbox
                  id="link1-iframe"
                  checked={linkIsIframe}
                  onCheckedChange={(checked) => setLinkIsIframe(!!checked)}
                />
                <Label htmlFor="link1-iframe" className="text-sm">Display as iframe</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Link 2</Label>
            <div className="flex gap-2 items-center">
              <Input
                value={link2Text}
                onChange={(e) => setLink2Text(e.target.value)}
                placeholder="Link description (optional)"
                className="flex-1 bg-white"
              />
              <Input
                value={link2}
                onChange={(e) => setLink2(e.target.value)}
                placeholder="Enter link URL..."
                className="flex-1 bg-white"
              />
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <Checkbox
                  id="link2-iframe"
                  checked={link2IsIframe}
                  onCheckedChange={(checked) => setLink2IsIframe(!!checked)}
                />
                <Label htmlFor="link2-iframe" className="text-sm">Display as iframe</Label>
              </div>
            </div>
          </div>

          <TableSelector
            label="Base 1"
            value={link3}
            displayName={link3Text}
            onTableChange={(tableId) => {
              setLink3(tableId);
              setLink3IsIframe(true); // Always display as iframe for tables
            }}
            onDisplayNameChange={setLink3Text}
          />

          <TableSelector
            label="Base 2"
            value={link4}
            displayName={link4Text}
            onTableChange={(tableId) => {
              setLink4(tableId);
              setLink4IsIframe(true); // Always display as iframe for tables
            }}
            onDisplayNameChange={setLink4Text}
          />
          
          <div className="space-y-2">
            <Label htmlFor="description">Note</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              rows={3}
              className="bg-white"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsOpen(false)} className="bg-primary text-primary-foreground">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};