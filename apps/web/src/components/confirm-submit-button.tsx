"use client";

import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  message: string;
  className?: string;
};

export function ConfirmSubmitButton({ children, message, className }: ConfirmSubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="destructive"
      size="sm"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
