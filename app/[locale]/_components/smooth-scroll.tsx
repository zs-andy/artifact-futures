"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis, { type VirtualScrollData } from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

let activeLenis: Lenis | null = null;

export const getLenis = () => activeLenis;

function isScrollLocked() {
  const { residency, home } = document.documentElement.dataset;
  return residency === "intro" || residency === "lift" || home === "intro";
}

export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const entered = useRef(false);

  useEffect(() => {
    if (!entered.current) {
      entered.current = true;
      return;
    }
    if (window.location.hash) return;

    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) {
      const onNativeAnchorClick = (event: MouseEvent) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const link =
          event.target instanceof Element
            ? event.target.closest<HTMLAnchorElement>('a[href^="#residency-"]')
            : null;
        if (!link) return;
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        event.preventDefault();
        if (window.location.hash !== link.hash) {
          window.history.pushState(null, "", link.hash);
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        }
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      document.addEventListener("click", onNativeAnchorClick);
      return () => document.removeEventListener("click", onNativeAnchorClick);
    }

    const lenis = new Lenis({ autoRaf: false, virtualScroll: ({ event }) => !event.defaultPrevented });
    lenisRef.current = lenis;
    activeLenis = lenis;
    let anchorTick = 0;
    const scrollToAnchor = (target: HTMLElement, immediate = false, focus = false) => {
      lenis.resize();
      const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - margin;
      lenis.scrollTo(window.scrollY, { immediate: true });
      lenis.scrollTo(top, {
        immediate,
        duration: 0.85,
        onComplete: () => {
          if (!focus) return;
          const tabIndex = target.getAttribute("tabindex");
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          if (tabIndex === null) target.removeAttribute("tabindex");
          else target.setAttribute("tabindex", tabIndex);
        },
      });
    };
    const onAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href^="#residency-"]')
          : null;
      if (!link) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      if (window.location.hash !== link.hash) {
        window.history.pushState(null, "", link.hash);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
      window.cancelAnimationFrame(anchorTick);
      anchorTick = window.requestAnimationFrame(() =>
        scrollToAnchor(target, false, event.detail === 0),
      );
    };
    document.addEventListener("click", onAnchorClick);
    const onHistoryNavigation = () => {
      window.cancelAnimationFrame(anchorTick);
      lenis.scrollTo(window.scrollY, { immediate: true });
    };
    window.addEventListener("popstate", onHistoryNavigation);
    const onScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);
    const onVirtualScroll = ({ event }: VirtualScrollData) => {
      document.documentElement.dataset.input = event.type.startsWith("touch") ? "touch" : "wheel";
    };
    lenis.on("virtual-scroll", onVirtualScroll);
    window.addEventListener("scroll", onScroll, { passive: true });

    const syncLock = () => {
      if (isScrollLocked()) {
        lenis.stop();
        lenis.scrollTo(0, { immediate: true });
        return;
      }
      lenis.start();
      if (document.documentElement.dataset.residency === "open" && window.location.hash) {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        if (target) scrollToAnchor(target, true);
      }
    };

    syncLock();

    const observer = new MutationObserver(syncLock);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-residency", "data-home"],
    });

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", onAnchorClick);
      window.removeEventListener("popstate", onHistoryNavigation);
      window.cancelAnimationFrame(anchorTick);
      window.removeEventListener("scroll", onScroll);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
      activeLenis = null;
      delete document.documentElement.dataset.input;
    };
  }, []);

  return null;
}
