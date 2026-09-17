"use client";

import { useTransform, motion, MotionValue } from "framer-motion";

interface TypewriterProps {
  text: string;
  progress: MotionValue<number>;
  range: [number, number];
  className?: string;
}

export function TypewriterWords({ text, progress, range, className = "" }: TypewriterProps) {
  const [start, end] = range;

  const currentLength = useTransform(progress, [start, end], [0, text.length]);

  const displayedText = useTransform(currentLength, (len) => {
    const chars = Math.floor(len);
    return text.slice(0, Math.max(0, chars));
  });

  const opacity = useTransform(progress, (p) => (p >= start ? 1 : 0));

  return (
    <motion.span style={{ opacity }} className={className}>
      <motion.span>{displayedText}</motion.span>
    </motion.span>
  );
}
