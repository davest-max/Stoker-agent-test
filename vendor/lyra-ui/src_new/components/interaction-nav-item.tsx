import * as React from "react";
import { cn } from "../lib/utils";
import { CHANNEL_ROW_COMPONENTS, CHANNEL_ACCENT, type InteractionChannel, type ChannelType } from "./channel-row";
import { Popover } from "./popover";

/* ── Helpers ── */

/** First + last name initials (e.g. "Sofia Martinez" → "SM"). Falls back to
 *  "C" (for "Customer") when there's no name to derive initials from. */
function getInitials(name?: string): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

/* ── InteractionNavItem ── */

export interface InteractionNavItemProps {
  /** Customer's full name — initials (compact mode) and the card title
   *  (expanded mode) are derived from this. Falls back to "C" / "Customer"
   *  when there's no customer attached to the interaction yet. */
  customerName?: string;
  /** Open channels/conversations for this interaction. A compact-mode count
   *  badge appears when there's more than one; the expanded card lists each
   *  as its own row (chip + elapsed time + preview), dispatched to the
   *  matching per-type row component (`ChatChannelRow`/`EmailChannelRow`/
   *  `SmsChannelRow`/`WhatsAppChannelRow`/`VoiceChannelRow` in
   *  `channel-row.tsx`) based on `type`. */
  channels?: InteractionChannel[];
  /** Elapsed time label as 4-digit MM:SS (e.g. "00:02" = 2 seconds since the
   *  customer's last response) — shown under the compact avatar tile. */
  elapsed: string;
  /** Marks this card as something other than a plain customer interaction —
   *  e.g. a headset glyph for an internal agent-to-agent voice call, where
   *  there's no customer identity to show initials for and showing them
   *  anyway (or falling back to the generic "C" placeholder) would
   *  misleadingly read as a customer interaction. Shown in two places: it
   *  overrides the compact tile's avatar glyph (normally initials derived
   *  from `customerName`), and it's also rendered next to `customerName` in
   *  the expanded card's header row — the same card the compact tile's hover
   *  preview shares via `cardBody`, so both stay in sync automatically. The
   *  consumer supplies a ready-to-render icon element (e.g. `<Headset
   *  className="h-4 w-4" />`), not just a component reference. */
  avatarIcon?: React.ReactNode;
  /**
   * True when the customer has sent a message the agent hasn't replied to
   * yet: the avatar switches from primary (blue) to critical (red) and a
   * red badge dot appears. Default (false) is primary with no badge.
   */
  awaitingResponse?: boolean;
  /** Whether this is the currently-open/selected interaction. */
  active?: boolean;
  /**
   * Whether the parent LeftNav rail is expanded. False renders the compact
   * avatar tile (icon-rail mode); true renders the full detail card. Mirrors
   * CreateNew's `expanded` prop so it can be used the same way as a LeftNav
   * `header`/`footer` slot.
   */
  expanded?: boolean;
  onClick?: () => void;
  /**
   * Called when the agent chooses "Unassign & Dismiss" from a channel's
   * kebab menu while this card has only that *one* channel open — with
   * nothing left once it's gone, the whole card goes with it, so the
   * consumer should remove it entirely (e.g. filter it out of whatever list
   * rendered it). When a card has more than one open channel, "Unassign &
   * Dismiss" calls `onDismissChannel` instead (see below) — this component
   * decides which of the two applies based on `channels.length` at click
   * time, so the consumer never has to duplicate that check itself. Omit to
   * leave "Unassign & Dismiss" inert on a single-channel card — e.g. for a
   * fixed demo card with no backing state to remove it from. Only wired onto
   * each channel's *default* menu; a channel with a `menuItems` override
   * handles its own actions instead. */
  onDismiss?: () => void;
  /**
   * Called with the specific channel object when the agent chooses
   * "Unassign & Dismiss" from a card that has *more than one* open channel —
   * ends just that one channel (the consumer should drop it from this
   * interaction's own channel list, matching on `channel.id ?? channel.type`
   * since two open channels can share the same `type`), leaving the rest of
   * the card and its other channels open. See `onDismiss` above for the
   * single-channel case, where the whole card goes instead. */
  onDismissChannel?: (channel: InteractionChannel) => void;
  /** Rendered at the end of the expanded card's header row, next to the
   *  customer name — e.g. an "Add Outbound" button (see `OutboundAddButton`
   *  in `create-new.tsx`) letting the agent start another channel with this
   *  same contact without leaving the card. Kept as a generic slot (not a
   *  dedicated `onAddOutbound` prop) so this component has no direct
   *  dependency on `create-new.tsx`'s outbound-picker types — the consumer
   *  composes whatever trigger it needs. Compact (icon-rail) mode has no
   *  header row of its own to put this in, but it isn't dropped there —
   *  hovering the compact tile opens a popover previewing the full expanded
   *  card (see the compact-mode branch below), and that preview's header
   *  row renders this exact same `headerAction`. If whatever's passed here
   *  opens its own popover (like `OutboundAddButton` does), make sure its
   *  z-index accounts for sometimes being nested inside that hover
   *  popover — see `OutboundAddButton`'s own doc comment in create-new.tsx. */
  headerAction?: React.ReactNode;
  /**
   * Controls which open channel is "current" (the blue-highlighted row on
   * an `active` card) from outside this component — e.g. a `ChannelTab` bar
   * rendered elsewhere (under a record-header `PageHeader`) that needs to
   * stay in lockstep with this same card. When provided, this always wins
   * over whatever the card would otherwise compute on its own (a row click,
   * or a newly-opened channel taking over as current); when omitted, the
   * card manages its own current-channel state exactly as before — every
   * existing consumer that doesn't pass this keeps working unchanged. Pass
   * the same key `onCurrentChannelChange` reports back (see below) — a
   * `channelKey`: `channel.id` when set, else `channel.type`.
   */
  currentChannelKey?: string;
  /**
   * Fired whenever the effective current channel changes — from a row
   * click, from a newly-opened channel auto-taking over, or (if this
   * component is uncontrolled) just to notify a listener without it having
   * to own `currentChannelKey` itself. A consumer building a synced
   * `ChannelTab` bar should store this in the same piece of state it passes
   * back in as `currentChannelKey`, so a click on either side updates both.
   */
  onCurrentChannelChange?: (key: string) => void;
  className?: string;
}

/** Identity used for current-channel tracking, click-to-select, and dismiss
 *  — `id` when the consumer supplied one, else `type`. See
 *  `InteractionChannel.id`'s own doc comment for why `type` alone isn't
 *  enough once an interaction can have two channels of the same type open
 *  at once. */
function channelKey(ch: InteractionChannel): string {
  return ch.id ?? ch.type;
}

const InteractionNavItem = React.forwardRef<HTMLDivElement, InteractionNavItemProps>(
  (
    {
      customerName,
      channels = [],
      elapsed,
      avatarIcon,
      awaitingResponse = false,
      active = false,
      expanded = false,
      onClick,
      onDismiss,
      onDismissChannel,
      headerAction,
      currentChannelKey,
      onCurrentChannelChange,
      className,
    },
    ref
  ) => {
    const initials = getInitials(customerName);
    const displayName = customerName || "Customer";
    const channelCount = channels.length;

    // The single channel actually treated as "current" (the one that gets
    // the blue-highlighted row) — resolved here rather than trusting each
    // `InteractionChannel.current` flag verbatim, since a consumer flipping
    // one channel's `current` to true has no way to also flip every sibling
    // back to false in that same update (a real bug: two channels both
    // landing on `current: true`, both rendering highlighted at once).
    // Keyed by `channelKey` (id, or `type` when no id was supplied) rather
    // than `type` alone — two channels can share a `type` (e.g. two SMS
    // threads with the same customer on different numbers), and keying on
    // `type` would highlight/select/dismiss *both* of them together instead
    // of just the one actually clicked. Falls back to the *last* channel
    // actually flagged `current` (ignoring any earlier stale ones), or the
    // last channel overall if none are flagged. Clicking any row (see
    // `onSelect` below) overrides this default — the override self-heals
    // back to the fallback once that channel is no longer present (e.g. it
    // was dismissed), since the `.some(...)` check below stops matching it.
    // This is what lets an agent toggle which open channel is "current"
    // within one card.
    const [manualCurrentKey, setManualCurrentKey] = React.useState<string | null>(null);

    // Opening a new channel on this interaction (e.g. the agent starts a
    // second channel with a contact who already has a card) always takes
    // over as "current" — even overriding a previous manual pick above —
    // since the whole point of opening it was to bring it into view now.
    // Without this, a card where the agent had earlier clicked to view one
    // channel would silently keep that one "current" forever, leaving every
    // newly-opened channel after it unhighlighted. Detected by diffing this
    // render's channel keys against the last render's (tracked as state,
    // not a ref, and adjusted directly during render per React's "adjusting
    // state when a prop changes" pattern — this re-renders immediately
    // before paint instead of one tick late the way a `useEffect` would).
    const currentChannelKeys = channels.map(channelKey);
    const [prevChannelKeys, setPrevChannelKeys] = React.useState<string[]>(currentChannelKeys);
    const channelKeysChanged =
      currentChannelKeys.length !== prevChannelKeys.length ||
      currentChannelKeys.some((k, i) => k !== prevChannelKeys[i]);
    if (channelKeysChanged) {
      setPrevChannelKeys(currentChannelKeys);
      const justOpenedKey = currentChannelKeys.find((k) => !prevChannelKeys.includes(k));
      if (justOpenedKey !== undefined) {
        setManualCurrentKey(justOpenedKey);
        // Also notify a controlling parent — when this component is
        // controlled (`currentChannelKey` prop passed), the internal
        // `setManualCurrentKey` above is inert for *display* purposes (see
        // `effectiveCurrentKey` below), so the parent's own state needs
        // this notification to actually pick up the newly-opened channel.
        onCurrentChannelChange?.(justOpenedKey);
      }
    }

    const fallbackCurrentChannel = [...channels].reverse().find((c) => c.current) ?? channels[channels.length - 1];
    const fallbackCurrentKey = fallbackCurrentChannel ? channelKey(fallbackCurrentChannel) : undefined;
    // Controlled (a `currentChannelKey` prop was passed) always wins over
    // whatever this card would otherwise compute on its own — see the
    // prop's own doc comment. Uncontrolled: unchanged from before, the
    // manual pick (if it still matches an open channel) or the fallback.
    const effectiveCurrentKey =
      currentChannelKey !== undefined
        ? currentChannelKey
        : channels.some((c) => channelKey(c) === manualCurrentKey) ? manualCurrentKey : fallbackCurrentKey;

    // The channel whose accent color (see `CHANNEL_ACCENT` in
    // `channel-row.tsx`) the card's own outer border borrows once it's
    // `active` — same "current" channel the highlighted row already tracks,
    // so a multi-channel card's border follows whichever channel the agent
    // last selected rather than picking arbitrarily between several open
    // channels.
    const currentChannel = channels.find((c) => channelKey(c) === effectiveCurrentKey) ?? channels[channels.length - 1];
    const currentChannelAccent = currentChannel ? CHANNEL_ACCENT[currentChannel.type] : undefined;

    // Compact mode only: hovering the icon-rail avatar tile opens a popover
    // previewing the full expanded card (name, headerAction, every channel
    // row) so the agent can read — and act on — the card's detail without
    // switching the whole rail to expanded mode. Same hover-intent pattern
    // as `OutboundContactRow`'s flyout in create-new.tsx: open immediately
    // on enter, but close on a short delay (rather than instantly on
    // mouseleave) so there's time to move the pointer from the tile into
    // the popover's own content — both the tile and the content re-arm the
    // open state on their own mouseenter, so hovering over either keeps it
    // open. Declared unconditionally (not inside the `!expanded` branch
    // below) because hooks can't be called conditionally, even though
    // they're only ever read there.
    const [hoverCardOpen, setHoverCardOpen] = React.useState(false);
    const closeHoverCardTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const openHoverCard = () => {
      if (closeHoverCardTimeoutRef.current) {
        clearTimeout(closeHoverCardTimeoutRef.current);
        closeHoverCardTimeoutRef.current = null;
      }
      setHoverCardOpen(true);
    };
    const scheduleCloseHoverCard = () => {
      if (closeHoverCardTimeoutRef.current) clearTimeout(closeHoverCardTimeoutRef.current);
      closeHoverCardTimeoutRef.current = setTimeout(() => setHoverCardOpen(false), 150);
    };
    React.useEffect(() => {
      return () => {
        if (closeHoverCardTimeoutRef.current) clearTimeout(closeHoverCardTimeoutRef.current);
      };
    }, []);

    // Compact-tile avatar coloring — channel identity now, not urgency (see
    // `CHANNEL_ACCENT`'s own doc comment). `border` (full strength) applies
    // when this tile is the active/selected interaction, `borderMuted`
    // (~30% opacity) otherwise — the same strong-vs-faded distinction the
    // old awaiting/active-driven tone used, just recolored per channel.
    // Falls back to the previous neutral info-blue when there's no channel
    // to color by (a card with an empty `channels` array).
    const tone = currentChannelAccent
      ? { bg: currentChannelAccent.bg, text: currentChannelAccent.text, border: active ? currentChannelAccent.border : currentChannelAccent.borderMuted }
      : { bg: "bg-lyra-status-info-subtle", text: "text-lyra-status-info-strong", border: active ? "border-lyra-border-active" : "border-lyra-border-subtle" };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.();
      }
    };

    const ariaLabel = `${displayName}${awaitingResponse ? ", awaiting response" : ""}${channelCount > 1 ? `, ${channelCount} open channels` : ""}, ${elapsed}`;

    // Header row + channel list — the expanded card's actual content,
    // factored out so it can be rendered both by the real expanded return
    // below and inside the compact tile's hover popover (see `!expanded`
    // branch), without keeping two copies of this markup in sync by hand.
    const cardBody = (
      <>
        <div className="flex items-center gap-2 px-4 pt-2 pb-1">
          {avatarIcon && (
            <span className="shrink-0 text-lyra-fg-secondary" aria-hidden="true">
              {avatarIcon}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate lyra-heading-sm text-lyra-fg-default">{displayName}</span>
          {headerAction}
        </div>

        {channels.length > 0 && (
          <div className="flex flex-col">
            {channels.map((ch, i) => {
              // Only ever highlighted on the active card — an inactive card's
              // "current" channel still renders plain, same as every other row.
              const highlighted = active && channelKey(ch) === effectiveCurrentKey;
              const RowComponent = CHANNEL_ROW_COMPONENTS[ch.type];
              return (
                <RowComponent
                  key={`${channelKey(ch)}-${i}`}
                  elapsed={ch.elapsed}
                  preview={ch.preview}
                  highlighted={highlighted}
                  isFirst={i === 0}
                  awaitingResponse={ch.awaitingResponse}
                  removable={ch.removable}
                  menuItems={ch.menuItems}
                  // More than one open channel — "Unassign & Dismiss" only
                  // ends this one, not the whole card (see `onDismissChannel`
                  // above). With just one, ending it means ending the card.
                  // Passes the whole channel (not just its `type`) so a
                  // consumer with two same-type channels open can tell
                  // exactly which one to drop.
                  onDismiss={() => {
                    if (channels.length > 1) onDismissChannel?.(ch);
                    else onDismiss?.();
                  }}
                  onSelect={() => {
                    // Unconditional even when controlled — harmless (ignored
                    // by `effectiveCurrentKey` while `currentChannelKey` is
                    // defined) and keeps the uncontrolled path unchanged.
                    setManualCurrentKey(channelKey(ch));
                    onCurrentChannelChange?.(channelKey(ch));
                  }}
                />
              );
            })}
          </div>
        )}
      </>
    );

    // The expanded card's own outer chrome (border/shadow/background),
    // shared between the real expanded return and the hover popover's
    // preview of it — same reasoning as `cardBody` above.
    const expandedCardClassName = cn(
      "flex w-full cursor-pointer flex-col overflow-hidden rounded-lyra-sm border-y border-r bg-lyra-bg-surface-base text-left transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
      active ? "border-l-4" : "border-l",
      // Active cards get a permanent `shadow-md` (the "elevated" token per
      // Shadows.stories.tsx); inactive cards stay flat, hover or not — the
      // real expanded (rail-expanded) card intentionally has no hover
      // shadow. Only the compact tile below (and its hover-popover preview,
      // which reuses this same class) gets a hover shadow — see that
      // branch's own comment for why the drop shadow is scoped to the
      // collapsed rail specifically, per an explicit follow-up request.
      active && "shadow-md",
      // Border color reflects the *channel* now, not urgency or a fixed
      // "active" blue — an active card's left border picks up its current
      // channel's own accent color (`CHANNEL_ACCENT`, same map the chip
      // uses), so voice/email/chat/etc. read as visually distinct all the
      // way down the rail. Awaiting-response no longer turns this border
      // red — that signal lives on the elapsed-time text (see
      // `ChannelRow`) and, in compact/icon-rail mode, the avatar tone and
      // pulsing dot below, so it isn't lost, just no longer duplicated
      // here. Inactive cards stay on the same neutral border as before —
      // only the active (selected) card shows channel color, matching how
      // only the active card got a colored border previously.
      active ? currentChannelAccent?.border ?? "border-lyra-border-active" : "border-lyra-border-subtle"
    );

    /* ── Compact: icon-rail avatar tile ── */
    if (!expanded) {
      return (
        <Popover
          open={hoverCardOpen}
          onOpenChange={setHoverCardOpen}
          placement="right"
          align="start"
          sideOffset={8}
          showArrow={false}
          // Hover-opened, not click-opened — stealing focus into the
          // popover the instant the pointer happens to land on the tile
          // would be disruptive (and isn't what a hover preview is for).
          onOpenAutoFocus={(e) => e.preventDefault()}
          // The preview card below already supplies its own complete
          // chrome (border/background/shadow, via `expandedCardClassName`)
          // matching the real expanded card exactly, so this popover's own
          // default panel styling is stripped down to a bare, invisible
          // frame around it — same "let the real content supply its own
          // chrome" convention `OutboundAddButton`'s Menu-in-Popover uses
          // in create-new.tsx.
          className="z-[9999] w-64 rounded-lyra-sm border-0 bg-transparent p-0 shadow-none"
          content={
            <div
              // Re-arms the open state on its own hover so moving the
              // pointer from the tile into this preview (to actually read
              // it or click something in it) doesn't let the close timer
              // started by leaving the tile go on to close it.
              onMouseEnter={openHoverCard}
              onMouseLeave={scheduleCloseHoverCard}
              role="button"
              tabIndex={0}
              onClick={onClick}
              onKeyDown={handleKeyDown}
              aria-label={ariaLabel}
              // `shadow-md` added here only (not baked into
              // `expandedCardClassName` itself, which the real expanded
              // card also uses and should stay flat) — always on while this
              // preview is shown, not just conditional on hover, per an
              // explicit follow-up ("this should always be there"). Skipped
              // when `active`, which already carries its own permanent
              // shadow via `expandedCardClassName`.
              className={cn(expandedCardClassName, !active && "shadow-md")}
            >
              {cardBody}
            </div>
          }
        >
          <div
            ref={ref}
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            onMouseEnter={openHoverCard}
            onMouseLeave={scheduleCloseHoverCard}
            aria-label={ariaLabel}
            aria-current={active ? "true" : undefined}
            className={cn(
              // `mb-2` lives here (on the item itself) rather than as a `gap` on
              // LeftNav's wrapping container, so spacing between cards — and
              // between the last card and the nav list below it — only appears
              // when there's an actual rendered tile to carry it. A parent `gap`
              // would still reserve that space even with zero interactions open,
              // since LeftNav's `header` slot is an always-truthy React node
              // (a Fragment around a `.map()`) even when it renders nothing.
              "flex cursor-pointer flex-col items-center gap-1 rounded-lyra-sm p-1.5 mb-2 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
              // No shadow on the tile itself, hover or not — per an explicit
              // follow-up, the drop shadow belongs only on the hover-popover
              // preview card above (the thing that actually appears on
              // hover), not this small icon-rail square.
              //
              // Background driven by `hoverCardOpen` state, not CSS `:hover`
              // — the pointer leaves this tile's own DOM node the moment it
              // moves into the preview popover next to it, which would
              // otherwise drop the `:hover` pseudo-class (and the
              // background with it) even though the preview it triggered is
              // still open and the tile should still read as "the one being
              // shown." `hoverCardOpen` stays true across that move (the
              // preview's own onMouseEnter re-arms it), so the background
              // does too.
              active ? "bg-lyra-bg-surface-base shadow-sm" : hoverCardOpen && "bg-lyra-state-hover",
              className
            )}
          >
            <span className="relative inline-flex">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lyra-sm border lyra-body-sm-emphasis",
                  tone.bg,
                  tone.text,
                  tone.border
                )}
                aria-hidden="true"
              >
                {avatarIcon ?? initials}
              </span>
              {channelCount > 1 && (
                <span
                  className={cn(
                    "absolute -left-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-lyra-fg-on-primary",
                    // Blue by default — only switches to the same critical
                    // red the avatar/border already use once the
                    // interaction is actually awaiting a response. This
                    // badge is just a count, not itself a "needs attention"
                    // signal, so it shouldn't default to red the way a
                    // notification badge would.
                    awaitingResponse ? "bg-lyra-bg-destructive" : "bg-lyra-bg-primary"
                  )}
                  aria-label={`${channelCount} open channels`}
                >
                  <span aria-hidden="true">{channelCount}</span>
                </span>
              )}
              {awaitingResponse && (
                <span
                  className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-lyra-status-critical-strong ring-2 ring-lyra-bg-surface-shell"
                  aria-hidden="true"
                />
              )}
            </span>
            <span className="lyra-body-xs text-lyra-fg-secondary" aria-hidden="true">{elapsed}</span>
          </div>
        </Popover>
      );
    }

    /* ── Expanded: full detail card ── */
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-current={active ? "true" : undefined}
        // `mb-2` (not baked into `expandedCardClassName`, which the compact
        // mode's hover-popover preview above also uses — that preview floats
        // in a Popover and shouldn't pick up a bottom margin) — same
        // per-item-not-parent-gap spacing as the compact tile above.
        className={cn(expandedCardClassName, "mb-2", className)}
      >
        {cardBody}
      </div>
    );
  }
);
InteractionNavItem.displayName = "InteractionNavItem";

export type { InteractionChannel, ChannelType } from "./channel-row";
export { InteractionNavItem };
