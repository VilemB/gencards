"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  front: string;
  back: string;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
}

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-[var(--neutral-200)] bg-[var(--foreground)] p-6 shadow-sm transition-all duration-200 hover:shadow-md backdrop-blur-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-[var(--text-primary)]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--text-secondary)]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export default function CardComponent({
  front,
  back,
  onNext,
  onPrevious,
  showNavigation = true,
}: CardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000">
      <motion.div
        className="relative w-full aspect-[3/2] cursor-pointer preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        onClick={handleFlip}
      >
        {/* Front */}
        <div className="card absolute w-full h-full backface-hidden">
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <p className="text-lg font-medium text-[var(--text-primary)]">
              {front}
            </p>
            <button
              className="absolute bottom-4 right-4 btn-ghost rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                handleFlip();
              }}
            >
              <RotateCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Back */}
        <div className="card absolute w-full h-full backface-hidden rotate-y-180">
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <p className="text-lg text-[var(--text-primary)]">{back}</p>
            <button
              className="absolute bottom-4 right-4 btn-ghost rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                handleFlip();
              }}
            >
              <RotateCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {showNavigation && (
        <div className="flex justify-center mt-6 gap-3">
          {onPrevious && (
            <button onClick={onPrevious} className="btn-secondary">
              Previous
            </button>
          )}
          {onNext && (
            <button onClick={onNext} className="btn-primary">
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContainer({
  children,
  className = "",
}: CardContainerProps) {
  return <div className={`card ${className}`}>{children}</div>;
}
