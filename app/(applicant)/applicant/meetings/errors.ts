const MESSAGES = new Map<string, string>([
  ["not-found", "We could not find that meeting. Refresh and try again."],
  ["not-requested", "This meeting is already booked."],
  ["not-booked", "Accept the meeting before deciding."],
  ["already-decided", "You already decided on this meeting."],
  ["not-a-match", "Sharing opens only when both sides chose Continue."],
  ["invalid-cv-url", "Enter the CV link as a full web address starting with http:// or https://."],
  ["invalid-portfolio-url", "Enter the portfolio link as a full web address starting with http:// or https://."],
]);

export function meetingErrorText(code: string): string {
  return MESSAGES.get(code) ?? "Something went wrong. Refresh and try again.";
}
