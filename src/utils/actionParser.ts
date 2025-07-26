export interface ParsedAction {
  mentionedName: string;
  action: string;
  dueDate: string;
  fullMatch: string;
}

export const parseActionsFromComment = (comment: string): ParsedAction[] => {
  // Match format: @Name,Action,Date
  const actionRegex = /@([^,]+),([^,]+),([^@\n]+)/g;
  const actions: ParsedAction[] = [];
  let match;
  
  while ((match = actionRegex.exec(comment)) !== null) {
    const [fullMatch, mentionedName, action, dueDate] = match;
    
    // Clean up whitespace
    const cleanName = mentionedName.trim();
    const cleanAction = action.trim();
    const cleanDate = dueDate.trim();
    
    if (cleanName && cleanAction && cleanDate) {
      actions.push({
        mentionedName: cleanName,
        action: cleanAction,
        dueDate: cleanDate,
        fullMatch
      });
    }
  }
  
  return actions;
};

export const validateAttendee = (mentionedName: string, attendees: string[]): string | null => {
  return attendees.find(attendee => 
    attendee.toLowerCase().includes(mentionedName.toLowerCase())
  ) || null;
};