"use client";
import { Hero } from "@/features/marketing/components/Hero";
import { NextSection } from "@/features/marketing/components/NextSection";
import Navbar from "@/features/marketing/sections/navbar/centered";
import Footer from "@/features/marketing/sections/footer/minimal";
import TabsLeft from "@/features/marketing/sections/tabs/left";
import Carousel from "@/features/marketing/sections/carousel/small";
import BentoGrid from "@/features/marketing/sections/bento-grid/2-rows-top";
import Faq from "@/features/marketing/sections/faq/2-cols-raised";
import Items from "@/features/marketing/sections/items/large-brand";
import CTA from "@/features/marketing/sections/cta/box";
import HeroSecond from "@/features/marketing/sections/hero/illustration";
export default function LandingRoot() {
  return (
    <div className="w-full">
      <Navbar />
      <section id="integrations">
        <Hero />
      </section>
      <section id="features">
        <Items />

        <BentoGrid />
        <Carousel />
      </section>
      <section id="faq">
        <Faq />
      </section>
      <section id="contact">
        <CTA />
      </section>
      <Footer />
    </div>
  );
}


