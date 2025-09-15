import {
  Item,
  ItemIcon,
  ItemTitle,
  ItemDescription,
} from "@/shared/ui/item";
import { Section } from "@/shared/ui/section";

interface ItemsProps {
  className?: string;
}

export default function Items({ className }: ItemsProps = {}) {
  return (
    <Section className={className}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-6 sm:gap-20">
        <h2 className="max-w-[560px] text-center text-3xl font-semibold sm:text-5xl">
          Title
        </h2>
        <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Item>
            <ItemIcon>{/* Icon */}</ItemIcon>
            <ItemTitle>Item Title</ItemTitle>
            <ItemDescription>Item description goes here</ItemDescription>
          </Item>
          {/* …more items */}
        </div>
      </div>
    </Section>
  );
}
