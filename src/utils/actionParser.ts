export interface ParsedAction {
  mentionedName: string;
  action: string;
  dueDate: string;
  fullMatch: string;
}

export const parseActionsFromComment = (comment: string): ParsedAction[] => {
  // Match format: @name action due:date or @name action due:📅 (before date is selected)
  const actionRegex = /@(\w+)\s+(.+?)\s+due:([\d-]+|📅)/g;
  const actions: ParsedAction[] = [];
  let match;
  
  while ((match = actionRegex.exec(comment)) !== null) {
    const [fullMatch, mentionedName, action, dueDate] = match;
    
    // Only include if we have a proper date (not the calendar emoji)
    if (dueDate !== '📅' && action.trim() && !action.includes('[action]')) {
      actions.push({
        mentionedName,
        action: action.trim(),
        dueDate,
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