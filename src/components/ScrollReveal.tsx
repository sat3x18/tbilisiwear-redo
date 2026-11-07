import { motion } from "framer-motion";
import { type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
  scale?: boolean;
}

const getInitial = (direction: Direction, distance: number, scale: boolean) => {
  const base: Record<string, number> = { opacity: 0 };
  if (scale) base.scale = 0.95;

  switch (direction) {
    case "up": base.y = distance; break;
    case "down": base.y = -distance; break;
    case "left": base.x = distance; break;
    case "right": base.x = -distance; break;
    case "none": break;
  }
  return base;
};

const getAnimate = (direction: Direction, scale: boolean) => {
  const base: Record<string, number> = { opacity: 1 };
  if (scale) base.scale = 1;
  if (direction === "up" || direction === "down") base.y = 0;
  if (direction === "left" || direction === "right") base.x = 0;
  return base;
};

const ScrollReveal = ({
  children,
  direction = "up",
  delay = 0,
  duration = 0.4,
  distance = 12,
  className = "",
  once = true,
  scale = false,
}: ScrollRevealProps) => {
  return (
    <motion.div
      initial={getInitial(direction, distance, scale)}
      whileInView={getAnimate(direction, scale)}
      viewport={{ once, margin: "-50px" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
