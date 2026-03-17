"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AccordionValue = string | null;

const AccordionRootContext = React.createContext<{
  value: AccordionValue;
  setValue: (value: AccordionValue) => void;
  collapsible: boolean;
} | null>(null);

const AccordionItemContext = React.createContext<{
  value: string;
} | null>(null);

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single";
  collapsible?: boolean;
  defaultValue?: string;
}

function Accordion({
  className,
  collapsible = false,
  defaultValue,
  children,
  ...props
}: AccordionProps) {
  const [value, setValue] = React.useState<AccordionValue>(defaultValue ?? null);

  return (
    <AccordionRootContext.Provider value={{ value, setValue, collapsible }}>
      <div className={cn("flex w-full flex-col", className)} {...props}>
        {children}
      </div>
    </AccordionRootContext.Provider>
  );
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function AccordionItem({ className, value, children, ...props }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={cn("", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const root = React.useContext(AccordionRootContext);
  const item = React.useContext(AccordionItemContext);

  if (!root || !item) {
    throw new Error("AccordionTrigger must be used within AccordionItem");
  }

  const isOpen = root.value === item.value;

  const handleClick = () => {
    if (isOpen && root.collapsible) {
      root.setValue(null);
      return;
    }
    root.setValue(item.value);
  };

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={handleClick}
      className={cn(
        "flex w-full items-start justify-between gap-4 py-2.5 text-left text-sm font-medium text-slate-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const root = React.useContext(AccordionRootContext);
  const item = React.useContext(AccordionItemContext);

  if (!root || !item) {
    throw new Error("AccordionContent must be used within AccordionItem");
  }

  const isOpen = root.value === item.value;

  if (!isOpen) {
    return null;
  }

  return (
    <div className={cn("overflow-hidden text-sm", className)} {...props}>
      {children}
    </div>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
