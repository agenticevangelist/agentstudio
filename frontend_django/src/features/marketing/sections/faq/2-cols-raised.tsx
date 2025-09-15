import { ReactNode } from "react";
import Link from "next/link";

import { Section } from "@/shared/ui/section";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/ui/accordion-raised";

interface FAQItemProps {
  question: string;
  answer: ReactNode;
  value?: string;
}

interface FAQProps {
  title?: string;
  items?: FAQItemProps[] | false;
  className?: string;
}

export default function FAQ({
  title = "Frequently asked questions",
  items = [
    {
      question: "What is Agent Studio?",
      answer: (
        <>
          <p className="text-muted-foreground mb-4 max-w-[640px] text-balance">
            Agent Studio helps you create helpful AI agents that run jobs for you — on triggers, on schedules, or on request. You can chat with agents, approve results, and keep full control.
          </p>
        </>
      ),
    },
    {
      question: "Do I have to code to use it?",
      answer: (
        <p className="text-muted-foreground mb-4 max-w-[640px] text-balance">
          No. You can start in minutes: connect apps, describe the outcome, and orchestrate the proccess..
        </p>
      ),
    },
    {
      question: "How do agents run jobs?",
      answer: (
        <p className="text-muted-foreground mb-4 max-w-[640px] text-balance">
          Jobs can start from messages, files, event triggers, or a schedule. Agents run in the background and ask for approval when needed.
        </p>
      ),
    },
    {
      question: "How do approvals and feedback work?",
      answer: (
        <p className="text-muted-foreground mb-4 max-w-[640px] text-balance">
          Approve with one click or reply in plain text. When you provide feedback, the agent tailors future results to match your preferences.
        </p>
      ),
    },
    {
      question: "What apps can I connect?",
      answer: (
        <p className="text-muted-foreground mb-4 max-w-[640px] text-balance">
          We have more then 900 apps and integrations with more then 5000 pre made tools. If you don't see an app you need, you can request it.
        </p>
      ),
    },
    {
      question: "Is my data safe?",
      answer: (
        <p className="text-muted-foreground mb-4 max-w-[640px] text-balance">
          You stay in control. Agents only use the accounts you connect, and you can require approval before anything is shared.
        </p>
      ),
    },
    {
      question: "Can agents learn my style?",
      answer: (
        <p className="text-muted-foreground mb-4 max-w-[640px] text-balance">
          Yes. Agents learn from your approvals and edits — tone, timing, and channels — so results feel right.
        </p>
      ),
    },
    {
      question: "How do I get started?",
      answer: (
        <p className="text-muted-foreground mb-4 max-w-[640px] text-balance">
          Create an account, connect an app or two, and try a template like Weekly Summary. You can always refine later in Chat or Inbox. <Link href="/signup" className="text-foreground underline">Get started</Link>.
        </p>
      ),
    },
  ],
  className,
}: FAQProps) {
  return (
    <Section className={className}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-8 md:flex-row md:items-start">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-5xl md:text-left md:leading-tight">
          {title}
        </h2>
        {items !== false && items.length > 0 && (
          <Accordion type="single" collapsible className="w-full max-w-[800px]">
            {items.map((item, index) => (
              <AccordionItem
                key={index}
                value={item.value || `item-${index + 1}`}
              >
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </Section>
  );
}
