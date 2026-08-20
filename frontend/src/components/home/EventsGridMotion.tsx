"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EventCard } from "@/components/public/EventCard";
import type { PublicEventDto } from "@/features/public/events/types";

interface EventsGridMotionProps {
  events: PublicEventDto[];
  locale: string;
}

const easeOutSmooth = [0.22, 1, 0.36, 1] as const;

export default function EventsGridMotion({ events, locale }: EventsGridMotionProps) {
  const reduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: reduceMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: easeOutSmooth,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="grid grid-cols-1 border-t border-site-border md:grid-cols-3"
    >
      {events.slice(0, 3).map((event) => (
        <motion.div key={event.slug} variants={itemVariants} className="h-full">
          <EventCard event={event} locale={locale} />
        </motion.div>
      ))}
    </motion.div>
  );
}
