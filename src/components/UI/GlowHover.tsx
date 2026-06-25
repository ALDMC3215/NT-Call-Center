import { useReducedMotion } from "framer-motion";
import {
  type CSSProperties,
  cloneElement,
  type ReactElement,
  type Ref,
  useEffect,
  useRef,
  useState,
} from "react";

export interface GlowHoverTheme {
  hue: number;
  lightness: number;
  saturation: number;
}

export interface GlowHoverItem {
  element: ReactElement;
  id: string;
  theme?: GlowHoverTheme;
}

export interface GlowHoverProps {
  className?: string;
  glowIntensity?: number;
  items: GlowHoverItem[];
  maskSize?: number;
}

export type GlowHoverCardTheme = GlowHoverTheme;
export type GlowHoverCardItem = GlowHoverItem;
export type GlowHoverCardsProps = GlowHoverProps;

export default function GlowHover({
  items,
  className = "",
  maskSize = 400,
  glowIntensity = 0.15,
}: GlowHoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const overlayItemRefs = useRef<(HTMLElement | null)[]>([]);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
    opacity: number;
  }>({ x: 0, y: 0, opacity: 0 });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldReduceMotion) {
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePosition({
        x,
        y,
        opacity: 1,
      });
    };

    const handlePointerLeave = () => {
      setMousePosition((prev) => ({ ...prev, opacity: 0 }));
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || !overlayRef.current || !containerRef.current) {
      return;
    }

    const syncCards = () => {
      const container = containerRef.current;
      const overlay = overlayRef.current;
      if (!(container && overlay)) {
        return;
      }

      itemRefs.current.forEach((itemEl, index) => {
        const overlayItemEl = overlayItemRefs.current[index];
        if (!(itemEl && overlayItemEl)) {
          return;
        }

        const itemRect = itemEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const left = itemRect.left - containerRect.left;
        const top = itemRect.top - containerRect.top;

        overlayItemEl.style.position = "absolute";
        overlayItemEl.style.left = `${left}px`;
        overlayItemEl.style.top = `${top}px`;
        overlayItemEl.style.width = `${itemRect.width}px`;
        overlayItemEl.style.height = `${itemRect.height}px`;
      });
    };

    const observers: ResizeObserver[] = [];
    const mutationObserver = new MutationObserver(syncCards);

    for (const itemEl of itemRefs.current) {
      if (!itemEl) {
        continue;
      }

      const observer = new ResizeObserver(() => {
        syncCards();
      });

      observer.observe(itemEl);
      observers.push(observer);
    }

    if (containerRef.current) {
      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    syncCards();

    window.addEventListener("scroll", syncCards, { passive: true });
    window.addEventListener("resize", syncCards);

    return () => {
      for (const observer of observers) {
        observer.disconnect();
      }
      mutationObserver.disconnect();
      window.removeEventListener("scroll", syncCards);
      window.removeEventListener("resize", syncCards);
    };
  }, [shouldReduceMotion]);

  const applyGlowStyles = (
    element: ReactElement,
    theme?: GlowHoverTheme,
    isOverlay = false
  ): ReactElement => {
    if (!isOverlay) {
      return element;
    }

    const props = element.props as {
      style?: CSSProperties;
      className?: string;
    };
    const existingStyle = props.style || {};
    const existingClassName = props.className || "";

    let glowStyles: CSSProperties;

    if (theme) {
      const hsl = `${theme.hue}, ${theme.saturation}%, ${theme.lightness}%`;
      glowStyles = {
        borderColor: `hsla(${hsl}, 1)`,
        boxShadow: `0 0 0 1px inset hsl(${hsl}), 0 0 20px hsla(${hsl}, ${glowIntensity})`,
        backgroundColor: `hsla(${hsl}, ${glowIntensity})`,
      };
    } else {
      // Hardcode cyan-500 fallback instead of variable
      const brandColor = "#06b6d4";
      glowStyles = {
        borderColor: brandColor,
        boxShadow: `0 0 0 1px inset ${brandColor}, 0 0 20px rgba(6, 182, 212, ${glowIntensity})`,
        backgroundColor: `rgba(6, 182, 212, ${glowIntensity})`,
      };
    }

    const mergedStyle = {
      ...existingStyle,
      ...glowStyles,
    };

    return cloneElement(element, {
      ...props,
      style: mergedStyle,
      className: [existingClassName, "glow-overlay-item"].filter(Boolean).join(" "),
    } as any);
  };

  return (
    <div
      className={["relative", className].filter(Boolean).join(" ")}
      ref={containerRef}
      style={shouldReduceMotion ? undefined : { willChange: "contents" }}
    >
      <div className="contents">
        {items.map((item, index) =>
          cloneElement(item.element, {
            key: item.id,
            ref: (el: HTMLElement | null) => {
              itemRefs.current[index] = el;
              const elementProps = item.element.props as {
                ref?: Ref<HTMLElement>;
              };
              const existingRef = elementProps?.ref;
              if (typeof existingRef === "function") {
                existingRef(el);
              } else if (existingRef && typeof existingRef === "object") {
                (existingRef as { current: HTMLElement | null }).current = el;
              }
            },
          } as any)
        )}
      </div>

      {!shouldReduceMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none z-50"
          ref={overlayRef}
          style={{
            opacity: mousePosition.opacity,
            maskImage: `radial-gradient(${maskSize}px ${maskSize}px at ${mousePosition.x}px ${mousePosition.y}px, #000 1%, transparent 50%)`,
            WebkitMaskImage: `radial-gradient(${maskSize}px ${maskSize}px at ${mousePosition.x}px ${mousePosition.y}px, #000 1%, transparent 50%)`,
            transition:
              "opacity 200ms ease, mask-image 200ms ease, -webkit-mask-image 200ms ease",
            willChange: "mask-image, opacity",
          }}
        >
          {items.map((item, index) => {
            const glowElement = applyGlowStyles(item.element, item.theme, true);
            return cloneElement(glowElement, {
              key: item.id,
              ref: (el: HTMLElement | null) => {
                overlayItemRefs.current[index] = el;
              },
            } as any);
          })}
        </div>
      )}
    </div>
  );
}

export function GlowHoverCards(props: GlowHoverCardsProps) {
  return <GlowHover {...props} />;
}
