import { useState } from "react";
import { Chip, type ChannelType } from "@nicecxone/lyra-ui";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactActionButtons } from "@/components/DirectoryPage";
import type { DirectoryCustomer, CustomerNote } from "@/data/directory";

const CHANNEL_LABEL: Record<ChannelType, string> = {
  voice: "Call",
  email: "Email",
  chat: "Chat",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="lyra-body-xs-emphasis uppercase tracking-wide text-lyra-fg-secondary">{children}</p>;
}

export interface CustomerSnapshotPanelProps {
  customer?: DirectoryCustomer;
  notes: CustomerNote[];
  onAddNote: (text: string) => void;
  onContactAction: (channel: ChannelType) => void;
}

export function CustomerSnapshotPanel({ customer, notes, onAddNote, onContactAction }: CustomerSnapshotPanelProps) {
  const [draftNote, setDraftNote] = useState("");

  if (!customer) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center lyra-body-sm text-lyra-fg-secondary">
        No customer profile linked to this interaction.
      </div>
    );
  }

  const handleAddNote = () => {
    const text = draftNote.trim();
    if (!text) return;
    onAddNote(text);
    setDraftNote("");
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      {/* ── Profile card ── */}
      <div className="flex flex-col gap-4 rounded-lyra-lg bg-lyra-bg-surface-shell p-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-full lyra-body-md-emphasis", customer.avatarClassName)}>
              {customer.initials}
            </div>
            {customer.tier === "VIP" && (
              <Chip
                color="orange"
                variant="solid"
                className="absolute -right-1 -top-1 h-4 px-1 lyra-body-xs-emphasis leading-none"
              >
                VIP
              </Chip>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="lyra-heading-sm truncate text-lyra-fg-default">{customer.name}</p>
            {(customer.customerSince || customer.totalInteractions !== undefined) && (
              <p className="lyra-body-sm text-lyra-fg-secondary">
                {customer.customerSince && <>Customer since {customer.customerSince}</>}
                {customer.customerSince && customer.totalInteractions !== undefined && " · "}
                {customer.totalInteractions !== undefined && <>{customer.totalInteractions} past interactions</>}
              </p>
            )}
          </div>
        </div>
        {customer.about && <p className="lyra-body-sm text-lyra-fg-default">{customer.about}</p>}
        {customer.preferredChannel && (
          <Chip color="blue" variant="solid" className="w-fit">
            Prefers {CHANNEL_LABEL[customer.preferredChannel]}
          </Chip>
        )}
        <ContactActionButtons channels={customer.channels} onAction={onContactAction} />
      </div>

      <div className="border-t border-lyra-border-subtle" />

      {/* ── Last interaction ── */}
      <div className="flex flex-col gap-2">
        <SectionHeading>Last Interaction</SectionHeading>
        {customer.lastInteraction ? (
          <div className="flex flex-col gap-1.5 rounded-lyra-md bg-lyra-bg-surface-container-subtle p-3">
            <div className="flex items-center gap-2 lyra-body-xs text-lyra-fg-secondary">
              <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
              {customer.lastInteraction.date} · {CHANNEL_LABEL[customer.lastInteraction.channel]}
              {customer.lastInteraction.outcome && (
                <Chip color="green" variant="subtle" className="ml-auto h-5 px-1.5 lyra-body-xs">
                  {customer.lastInteraction.outcome}
                </Chip>
              )}
            </div>
            <p className="lyra-body-sm text-lyra-fg-default">{customer.lastInteraction.summary}</p>
            {(customer.lastInteraction.caseId || customer.lastInteraction.handledBy) && (
              <p className="lyra-body-xs text-lyra-fg-secondary">
                {customer.lastInteraction.caseId}
                {customer.lastInteraction.caseId && customer.lastInteraction.handledBy && " · "}
                {customer.lastInteraction.handledBy && <>Handled by {customer.lastInteraction.handledBy}</>}
              </p>
            )}
          </div>
        ) : (
          <p className="lyra-body-sm text-lyra-fg-secondary">No prior interactions on record.</p>
        )}
      </div>

      <div className="border-t border-lyra-border-subtle" />

      {/* ── Notes — existing notes shown above the input ── */}
      <div className="flex flex-col gap-3">
        <SectionHeading>Notes</SectionHeading>
        {notes.length > 0 && (
          <div className="flex flex-col gap-2">
            {notes.map((note) => (
              <div key={note.id} className="flex flex-col gap-0.5">
                <p className="lyra-body-xs-emphasis text-lyra-fg-secondary">
                  {note.author} · {note.timestamp}
                </p>
                <p className="lyra-body-sm text-lyra-fg-default">&quot;{note.text}&quot;</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <textarea
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Add a note about this customer…"
            rows={2}
            className="w-full resize-none rounded-lyra-sm border border-lyra-border-default bg-lyra-bg-control px-2.5 py-2 lyra-body-sm text-lyra-fg-default placeholder:text-lyra-fg-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
          />
          <button
            type="button"
            onClick={handleAddNote}
            disabled={!draftNote.trim()}
            className="self-end rounded-lyra-sm px-2.5 py-1 lyra-body-sm-emphasis text-lyra-fg-action transition-colors hover:bg-lyra-state-hover disabled:pointer-events-none disabled:opacity-40"
          >
            Add note
          </button>
        </div>
      </div>
    </div>
  );
}
