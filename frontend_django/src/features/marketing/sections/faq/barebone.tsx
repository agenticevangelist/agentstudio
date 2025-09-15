import { ReactNode } from "react";

import { Section } from "@/shared/ui/section";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/ui/accordion";

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
  title = "Frequently Asked Questions",
  items = [
    {
      question: "What is Launch UI?",
      answer: (
        <p className="text-muted-foreground">
          Launch UI is a professional landing page UI kit built with React,
          Next.js, Tailwind CSS, and TypeScript.
        </p>
      ),
    },
    {
      question: "Can I use Launch UI for my projects?",
      answer: (
        <p className="text-muted-foreground">
          Yes, Launch UI is available for personal and commercial projects. The
          basic version is open-source and the PRO version is available for a
          one-time purchase.
        </p>
      ),
    },
  ],
  className,
}: FAQProps) {
  return (
    <Section className={className}>
      <h2 className="text-center text-3xl font-semibold sm:text-4xl">
        {title}
      </h2>
      {items !== false && items.length > 0 && (
        <Accordion
          type="single"
          collapsible
          className="mt-8 w-full max-w-[800px]"
        >
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
    </Section>
  );
}
