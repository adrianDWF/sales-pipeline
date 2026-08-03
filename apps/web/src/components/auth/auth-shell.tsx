"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const SLIDES = [
  {
    image: "/auth/slide-1.png",
    title: "Manage all your digital marketing from one place.",
    description:
      "A unified platform that connects Google Analytics, Search Console, and Ads — so everything works faster, simpler, and smarter.",
  },
  {
    image: "/auth/slide-2.png",
    title: "Collaborate on client performance together.",
    description:
      "Share portfolio insights across your team and keep everyone aligned on what matters for each account.",
  },
  {
    image: "/auth/slide-3.png",
    title: "See what your ecommerce data is really telling you.",
    description:
      "SEO, paid, and analytics KPIs in one view — clicks, impressions, sessions, and revenue at a glance.",
  },
  {
    image: "/auth/slide-4.png",
    title: "Built for agencies managing client accounts.",
    description:
      "Organize accounts, sync weekly, and control access with roles and approval before anyone enters the workspace.",
  },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <div className="flex min-h-svh bg-background">
      <div className="relative hidden min-h-svh w-[45%] shrink-0 overflow-hidden lg:block">
        {SLIDES.map((item, slideIndex) => (
          <Image
            key={item.image}
            src={item.image}
            alt=""
            fill
            priority={slideIndex === 0}
            className={cn(
              "object-cover transition-opacity duration-700",
              slideIndex === index ? "opacity-100" : "opacity-0",
            )}
            sizes="45vw"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 p-7">
          <div className="rounded-2xl bg-black/45 p-6 text-white backdrop-blur-sm">
            <h2 className="text-xl font-semibold leading-snug">{slide.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              {slide.description}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                className="flex size-9 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white/10"
                aria-label={paused ? "Play carousel" : "Pause carousel"}
              >
                {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              </button>
              <span className="text-sm text-white/80">
                {index + 1}/{SLIDES.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setIndex((current) => (current - 1 + SLIDES.length) % SLIDES.length)
                }
                className="flex size-9 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white/10"
                aria-label="Previous slide"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((current) => (current + 1) % SLIDES.length)}
                className="flex size-9 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white/10"
                aria-label="Next slide"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-svh flex-1 flex-col overflow-y-auto px-6 py-7 sm:px-9 lg:px-12">
        {children}
      </div>
    </div>
  );
}

export function AuthModeToggle({
  mode,
  onModeChange,
}: {
  mode: "login" | "signup";
  onModeChange: (mode: "login" | "signup") => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-muted p-1">
      {(["login", "signup"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onModeChange(value)}
          className={cn(
            "rounded-full px-5 py-1.5 text-sm font-medium transition",
            mode === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {value === "login" ? "Login" : "Sign up"}
        </button>
      ))}
    </div>
  );
}
