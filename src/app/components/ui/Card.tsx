"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";

interface CardProps {
  front: string;
  back: string;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
}

export default function Card({
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
