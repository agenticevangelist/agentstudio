import * as React from "react";
import Glow from "@/shared/ui/glow";

function CodeEditorIllustration() {
  return (
    <div data-slot="code-editor-illustration" className="h-full w-full">
      <div className="relative h-full w-full">
        <div className="absolute top-0 left-[50%] z-10 w-full -translate-x-[50%] translate-y-0">
          <div className="border-border/100 bg-muted dark:border-border/5 dark:border-t-border/15 dark:bg-accent/30 relative flex min-h-[540px] min-w-[460px] flex-col rounded-[12px] border">
            <div className="flex w-full items-center justify-start gap-4 overflow-hidden py-2">
              <div className="hidden gap-2 pl-4 lg:flex">
                <div className="bg-accent dark:bg-foreground/10 size-3 rounded-full"></div>
                <div className="bg-accent dark:bg-foreground/10 size-3 rounded-full"></div>
                <div className="bg-accent dark:bg-foreground/10 size-3 rounded-full"></div>
              </div>
              <div className="relative flex w-[320px]">
                <div className="text-muted-foreground relative z-10 flex grow basis-0 items-center gap-2 px-4 py-1.5 text-xs">
                  <div className="bg-foreground/20 size-4 shrink-0 rounded-sm" />
                  <p>Chat</p>
                </div>
                <div className="text-muted-foreground relative z-10 flex grow basis-0 items-center gap-2 px-4 py-1.5 text-xs">
                  <div className="bg-foreground/20 size-4 shrink-0 rounded-sm" />
                  <p>Inbox</p>
                </div>
                <div className="absolute top-0 left-0 h-full w-[50%] px-2 transition-all duration-1000 ease-in-out group-hover:left-[50%]">
                  <div className="glass-4 h-full w-full rounded-md shadow-md"></div>
                </div>
              </div>
            </div>
            <div className="relative w-full grow overflow-hidden">
              {/* Chat pane */}
              <div className="absolute top-0 left-0 w-full translate-x-0 px-6 py-6 transition-all duration-1000 ease-in-out group-hover:translate-x-[-100%] group-hover:opacity-0">
                <div className="flex flex-col gap-3 w-full">
                  {/* AI (left) */}
                  <div className="flex items-start gap-2">
                    <div className="bg-brand/50 size-6 shrink-0" />
                    <div className="bg-accent/70 text-foreground/90 max-w-[80%] px-3 py-2 text-xs">
                      I can create a job: "Weekly summary". Every Friday I’ll collect updates from email, docs, and calendar and will share a report the team.
                    </div>
                  </div>
                  {/* You (right) */}
                  <div className="flex items-start gap-2 justify-end">
                    <div className="bg-foreground text-background max-w-[80%] px-3 py-2 text-xs">
                      Create it and ask me before sharing the report.
                    </div>
                    <div className="bg-foreground/80 size-6 shrink-0" />
                  </div>
                  {/* AI (left) */}
                  <div className="flex items-start gap-2">
                    <div className="bg-brand/50 size-6 shrink-0" />
                    <div className="bg-accent/70 text-foreground/90 max-w-[80%] px-3 py-2 text-xs">
                      Done. I’ll request approval before the report goes out.
                    </div>
                  </div>
                </div>
              </div>

              {/* Jobs pane */}
              <div className="absolute top-0 left-0 w-full translate-x-[100%]  opacity-0 transition-all duration-1000 ease-in-out group-hover:translate-x-0 group-hover:opacity-100">
                {/* Email-like two-pane layout */}
                <div className="border-border/40 bg-background/60 dark:border-border/20 grid w-full grid-cols-12 border text-xs">
                  {/* List */}
                  <div className="border-border/30 col-span-5 border-r">
                    {[
                      { from: "Summary bot", subject: "Needs approval: Send weekly summary", time: "Now", kind: "approval" },
                      { from: "Reminder bot", subject: "Scheduled: Daily reminders at 9am", time: "9:00", kind: "scheduled" },
                      { from: "Organizer", subject: "Completed: Filed 6 new documents", time: "5m", kind: "done" },
                      { from: "Calendar helper", subject: "Completed: Updated next week’s events", time: "Today", kind: "done" },
                      { from: "Notifier", subject: "Needs approval: Share progress update", time: "12m", kind: "approval" },
                    ].map((m, i) => (
                      <div key={i} className="hover:bg-accent/40 border-border/20 grid grid-cols-6 items-center gap-2 border-b px-3 py-2 last:border-b-0">
                        <div className="col-span-2 text-foreground/90">{m.from}</div>
                        <div className="col-span-3 text-muted-foreground truncate">{m.subject}</div>
                        <div className="col-span-1 text-muted-foreground text-right">{m.time}</div>
                      </div>
                    ))}
                  </div>
                  {/* Preview */}
                  <div className="col-span-7">
                    <div className="border-border/20 flex items-center justify-between border-b px-3 py-2">
                      <div className="text-foreground">Needs approval: Send weekly summary</div>
                      <div className="text-muted-foreground">Now</div>
                    </div>
                    <div className="space-y-3 p-3">
                      <div className="text-foreground/90">Action requested</div>
                      <div className="text-muted-foreground">Your weekly summary is ready. Share with the team?</div>
                      <div className="flex gap-2 pt-2">
                        <div className="bg-foreground text-background px-2 py-1">Approve</div>
                        <div className="bg-foreground/20 text-foreground px-2 py-1">Edit</div>
                        <div className="bg-foreground/10 text-foreground/80 px-2 py-1">Dismiss</div>
                      </div>
                      <div className="border-border/20 my-3 border-t" />
                      <div className="text-foreground/90">Recent activity</div>
                      <div className="bg-accent/30 h-2 w-3/4" />
                      <div className="bg-accent/30 h-2 w-2/3" />
                      <div className="bg-accent/30 h-2 w-1/2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Glow
          variant="below"
          className="translate-y-32 scale-150 opacity-40 transition-all duration-1000 group-hover:scale-200 group-hover:opacity-60"
        />
      </div>
    </div>
  );
}

export default CodeEditorIllustration;
