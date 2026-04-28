/**
 * EN-переводы для mock-данных. Ключи — id из data.ts.
 * Хуки лендинга мерджат это поверх RU-сидов, когда локаль — "en".
 */

import type {
  BenefitItem,
  CaseItem,
  Channel,
  ChatMessage,
  FaqItem,
  FeatureItem,
  HowItWorksStep,
  PricingPlan,
  ScenarioItem,
  TrustLogo,
} from "@/types/entities";

type FieldsOf<T, K extends keyof T> = Pick<T, K>;

export const channelsEn: Record<string, FieldsOf<Channel, "name" | "description">> = {
  telegram: { name: "Telegram", description: "Bot in DMs and groups" },
  website: { name: "Website", description: "Chat widget on any site" },
  avito: { name: "Avito", description: "Replies to listing messages" },
  vk: { name: "VK", description: "Community DMs" },
  whatsapp: { name: "WhatsApp", description: "Via official WABA" },
  instagram: { name: "Instagram DM", description: "Direct messages on your profile" },
};

export const featuresEn: Record<string, FieldsOf<FeatureItem, "title" | "description">> = {
  answer: {
    title: "Replies in 7 seconds",
    description:
      "A customer writes. The assistant answers instantly, in your tone, by your rules.",
  },
  qualify: {
    title: "Qualifies the lead",
    description:
      "Asks follow-ups, captures contact, budget, deadlines and hands the lead to a manager.",
  },
  sell: {
    title: "Closes the deal",
    description:
      "Picks an offer from your catalog and sends a payment or booking link.",
  },
  crm: {
    title: "Writes to your CRM",
    description: "Creates the deal, assigns a task to a manager, never loses anything.",
  },
};

export const benefitsEn: Record<string, FieldsOf<BenefitItem, "title" | "description">> = {
  b1: {
    title: "Doesn’t take a lunch break",
    description: "Runs 24/7. Night-time leads are no longer money left on the table.",
  },
  b2: {
    title: "Doesn’t get lost in your product",
    description:
      "Knows the price list, stock, promos and FAQ. Never says “let me check with a manager”.",
  },
  b3: {
    title: "Doesn’t burn out on the 100th “what about the price?”",
    description: "Same tone on the 1st and the 1000th question.",
  },
  b4: {
    title: "Doesn’t leave for a competitor",
    description: "Set up once and runs for a year. No turnover, no retraining.",
  },
};

export const howEn: Record<
  string,
  FieldsOf<HowItWorksStep, "title" | "description">
> = {
  h1: {
    title: "We load the knowledge base",
    description: "Price list, FAQ, product copy, links — any format.",
  },
  h2: {
    title: "We tune the tone and scenarios",
    description:
      "On-brand: from a strict lawyer to a friendly consultant. We define what to do in edge cases.",
  },
  h3: {
    title: "We connect the channels",
    description:
      "Telegram, website, Avito, VK — wired in a couple of hours. Tested on real conversations.",
  },
  h4: {
    title: "Live launch",
    description:
      "Three days after kickoff the assistant replies to customers and drops leads into your CRM.",
  },
};

export const scenariosEn: Record<
  string,
  FieldsOf<ScenarioItem, "title" | "bullet" | "metric">
> = {
  realestate: {
    title: "Real estate",
    bullet: "Picks a flat by budget and area, books the viewing.",
    metric: "+38% to viewing conversion",
  },
  auto: {
    title: "Auto & Avito",
    bullet: "Replies to 100% of listing messages, filters out resellers.",
    metric: "−6h/day for the manager",
  },
  clinic: {
    title: "Clinics",
    bullet: "Books appointments, reminds, reschedules — without an operator.",
    metric: "92% of bookings without a human",
  },
  school: {
    title: "Online schools",
    bullet: "Explains the program, calculates installment plans, drives to payment.",
    metric: "×2.1 revenue from traffic",
  },
  services: {
    title: "Services",
    bullet: "Estimates the price, agrees on the timing, books the specialist.",
    metric: "+62 leads / month",
  },
  agency: {
    title: "Agencies",
    bullet:
      "Qualifies the client by checklist before the call, saves the team’s time.",
    metric: "−40% briefing time",
  },
};

export const pricingEn: Record<
  string,
  Pick<PricingPlan, "name" | "tagline" | "forWho" | "features"> & {
    cta: { label: string };
  }
> = {
  start: {
    name: "Start",
    tagline: "One assistant, one channel. To give it a try.",
    forWho:
      "For a solo business that wants to automate the first replies.",
    features: [
      "1 assistant",
      "1 channel of your choice",
      "Up to 1,000 conversations / mo",
      "Knowledge base up to 50 pages",
      "Email support",
      "Basic analytics",
    ],
    cta: { label: "Try Start" },
  },
  growth: {
    name: "Growth",
    tagline: "For a business that already counts revenue from traffic.",
    forWho: "If you have a sales team and 100+ leads a month.",
    features: [
      "Up to 3 assistants",
      "All channels",
      "Up to 10,000 conversations / mo",
      "CRM integration",
      "Unlimited knowledge base",
      "Telegram support",
      "Advanced analytics",
      "Excel export",
    ],
    cta: { label: "Pick Growth" },
  },
  scale: {
    name: "Scale",
    tagline: "Multiple verticals, sales teams, custom integrations.",
    forWho:
      "For chain businesses and companies with several product lines.",
    features: [
      "Unlimited assistants",
      "All channels + API",
      "Unlimited conversations",
      "Custom integrations",
      "Dedicated manager",
      "SLA 99.9%",
      "White-label option",
      "Priority on new features",
    ],
    cta: { label: "Talk to the team" },
  },
};

export const faqEn: Record<string, FieldsOf<FaqItem, "question" | "answer">> = {
  q1: {
    question: "How long does the launch take?",
    answer:
      "If you already have product copy and access to the channel — 1–3 business days. We load the knowledge base, set the tone and the scenarios ourselves.",
  },
  q2: {
    question: "Will the assistant feel like a real person?",
    answer:
      "Yes, in your tone. We tune the style on-brand: from a strict lawyer to a friendly consultant.",
  },
  q3: {
    question: "What if the assistant doesn’t know the answer?",
    answer:
      "It honestly says it’ll check and hands the chat to a manager. No made-up facts.",
  },
  q4: {
    question: "Do you connect to our CRM?",
    answer:
      "Yes: amoCRM, Bitrix24, retailCRM, YClients. If your CRM is non-standard, we ship a custom integration on the Scale plan.",
  },
  q5: {
    question: "What if a customer wants to talk to a human?",
    answer:
      "We hand the chat to a manager in one click with the full history. You stay in control.",
  },
  q6: {
    question: "Can we get a refund if it doesn’t fit?",
    answer:
      "Yes — full refund within the first 14 days, no questions asked. After that we work by contract.",
  },
  q7: {
    question: "Where is customer data stored?",
    answer:
      "On servers in Russia, in compliance with 152-FZ. Access only for you and your team.",
  },
};

export const casesEn: Record<
  string,
  FieldsOf<CaseItem, "company" | "quote" | "author" | "metric">
> = {
  c1: {
    company: "“Kontur” renovation studio",
    quote:
      "We used to lose 40% of leads at night. Now the assistant closes them itself.",
    author: "Igor Lapin, founder",
    metric: "+62 leads / mo",
  },
  c2: {
    company: "“Sever” car dealership",
    quote:
      "Our Avito manager was freed up entirely. We closed three open headcount.",
    author: "Marina Sokolova, head of sales",
    metric: "−420,000 ₽ payroll / mo",
  },
  c3: {
    company: "“Alpha” dental clinic",
    quote:
      "Bookings now come in 24/7. The receptionist only confirms them.",
    author: "Alexey Grinev, director",
    metric: "92% of bookings without an operator",
  },
};

export const trustLogosEn: Record<string, FieldsOf<TrustLogo, "name">> = {
  t1: { name: "Kontur" },
  t2: { name: "Sever" },
  t3: { name: "Alpha" },
  t4: { name: "Mayak" },
  t5: { name: "Orbita" },
  t6: { name: "Liniya" },
};

export const heroChatEn: Record<string, FieldsOf<ChatMessage, "text">> = {
  m1: { text: "Hi, do you have a 2-bedroom in Parus under 14M?" },
  m2: {
    text:
      "Yes, three options. Quick check — do you need a balcony, and what floor would you prefer?",
  },
  m3: { text: "Balcony yes, floor 5 and up" },
  m4: {
    text: "Picked two — 8th and 12th floor. Want to book a viewing on Saturday?",
  },
  m5: { text: "Let’s do 12:00" },
  m6: {
    text:
      "Done. Booked you with Anna for Saturday at 12:00. I’ll send the address and the manager’s contact on Telegram.",
  },
};
