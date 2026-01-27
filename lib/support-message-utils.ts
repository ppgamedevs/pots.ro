/** Incoming = from customer/bot; outgoing = Support, Admin. Only incoming trigger sound/unread. */
export function isIncomingMessage(msg: { authorDisplayLabel?: string | null }): boolean {
  const label = (msg.authorDisplayLabel ?? "").trim();
  return label !== "Support" && label !== "Admin";
}
