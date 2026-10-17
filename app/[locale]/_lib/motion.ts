import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(CustomEase, ScrollTrigger);

export const SWIFT = CustomEase.create("home.swift", "0.16,1,0.3,1");
export const SMOOTH = CustomEase.create("home.smooth", "0.65,0,0.35,1");
export const EXIT = CustomEase.create("home.exit", "0.7,0,0.84,0");
export const BLOOM = CustomEase.create("home.bloom", "0.8,0,0.2,1");

export { gsap, ScrollTrigger };
