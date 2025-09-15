"use client";

import { Button } from "@/shared/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/features/chat/prompt-kit/prompt-input";

export function ThreadComposer({
  value,
  onChange,
  onSend,
  disabled,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  onClose?: () => void;
}) {
  return (
    <div className="p-3 md:p-4 bg-card border-t">
      <PromptInput
        isLoading={false}
        value={value}
        onValueChange={onChange}
        onSubmit={onSend}
        className="border-input bg-popover relative z-10 w-full border p-0 pt-1 shadow-xs"
      >
        <div className="flex flex-col">
          <PromptInputTextarea
            placeholder="Reply…"
            className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
          />

          <PromptInputActions className="mt-4 flex w-full items-center justify-between gap-2 px-3 pb-3">
            <div className="flex items-center gap-2">
              {/* Reserved for future composer actions to match chat UI spacing */}
            </div>
            <div className="flex items-center gap-2">
              {onClose ? (
                <PromptInputAction tooltip="Close" side="top">
                  <Button variant="outline" onClick={(e) => { e.stopPropagation(); onClose?.(); }} disabled={disabled}>
                    Close
                  </Button>
                </PromptInputAction>
              ) : null}
              <Button type="submit" onClick={(e) => { e.stopPropagation(); onSend(); }} disabled={disabled} className="px-4">Send</Button>
            </div>
          </PromptInputActions>
        </div>
      </PromptInput>
    </div>
  );
}

export default ThreadComposer;


