import { COMMUNITY_CATEGORIES, LAUNCH_CITIES } from "@wmc/shared";

export const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#community", label: "Community" },
  { href: "#faq", label: "FAQ" },
] as const;

export const HOW_IT_WORKS = [
  { step: "01", title: "Create your profile", text: "Tell us what you like." },
  { step: "02", title: "Find your people", text: "Discover people and communities nearby." },
  { step: "03", title: "Join real activities", text: "Meet people offline." },
] as const;

export const FEATURES = [
  { icon: "users", title: "Meet People", text: "Connect with Muslims near you." },
  { icon: "communities", title: "Join Communities", text: "Find groups that match your interests." },
  {
    icon: "calendar",
    title: "Discover Events",
    text: "From sports to study circles, there's always something happening.",
  },
  {
    icon: "sparkles",
    title: "“Join me”",
    text: "Post “Anyone up for coffee tonight?” and let your community show up.",
  },
] as const;

const category = (slug: string) => COMMUNITY_CATEGORIES.find((c) => c.slug === slug);

export const COMMUNITY_CARDS = [
  { emoji: "⚽", name: "Football", blurb: "Weekly kickabouts and 5-a-side leagues." },
  { emoji: "🏃", name: "Running", blurb: "Morning runs, park loops and race crews." },
  { emoji: category("business")?.emoji ?? "💼", name: "Business", blurb: "Founders, freelancers and professionals." },
  { emoji: category("students")?.emoji ?? "🎓", name: "Students", blurb: "Campus groups and study buddies." },
  { emoji: category("islamic_studies")?.emoji ?? "📖", name: "Study", blurb: "Quran circles and learning together." },
  { emoji: category("volunteering")?.emoji ?? "🤝", name: "Volunteering", blurb: "Give back, side by side." },
] as const;

export const SAMPLE_EVENTS = [
  { emoji: "⚽", title: "Football Meetup", when: "Sat · 18:00", city: "London", going: 18 },
  { emoji: "☕", title: "Coffee & Networking", when: "Thu · 19:00", city: "Berlin", going: 12 },
  { emoji: "📖", title: "Quran Circle", when: "Sun · 10:30", city: "Toronto", going: 9 },
  { emoji: "🥾", title: "Hiking", when: "Sat · 08:00", city: "Dubai", going: 24 },
  { emoji: "🍽️", title: "Community Iftar", when: "Fri · 19:45", city: "Paris", going: 60 },
] as const;

export const CITIES = LAUNCH_CITIES;

export const TRUST_CARDS = [
  {
    icon: "lock",
    title: "Privacy",
    text: "Your exact location is never shown — only “near you” or your city.",
  },
  {
    icon: "shield",
    title: "Safety",
    text: "Report & block on every profile, event and message. Human moderation.",
  },
  {
    icon: "handshake",
    title: "Community Guidelines",
    text: "Respect, no harassment, no dating.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote: "I moved to Berlin knowing no one. Two weeks later I had a football group and people to break fast with.",
    name: "Sara",
    meta: "24, Student, Berlin",
  },
  {
    quote: "Finally an app that isn't about swiping. Just real people, real plans, a coffee after Jumu'ah.",
    name: "Omar",
    meta: "28, Engineer, London",
  },
  {
    quote: "The “Join me” posts are my favourite. Someone always shows up.",
    name: "Aisha",
    meta: "26, Designer, Paris",
  },
] as const;

export const FAQ = [
  {
    q: "Is WMC a dating app?",
    a: "No. WMC is for friendship, community and activities. Dating, flirting or solicitation goes against our guidelines and gets accounts removed.",
  },
  {
    q: "Is it free?",
    a: "Yes. Creating a profile, joining communities and attending events is free. We may add optional features for organisers later.",
  },
  {
    q: "Is my location shared?",
    a: "Never precisely. Other members only ever see your city or a rough “near you” label. You can also hide your location entirely.",
  },
  {
    q: "Who can join?",
    a: "Anyone 16 or older who wants to find their Muslim community. You'll need to complete a short profile so we can match you with the right people.",
  },
  {
    q: "Which cities?",
    a: "We're launching city by city, starting with London, Berlin, Dubai and Toronto, with more cities opening as communities form. Request yours below.",
  },
  {
    q: "How do I report someone?",
    a: "Every profile, event, community and message has a Report option. Our moderation team reviews every report, and you can block anyone instantly.",
  },
] as const;

export const FOOTER_LINKS = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#community", label: "Community" },
  { href: "#faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/guidelines", label: "Community Guidelines" },
] as const;
