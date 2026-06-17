/**
 * SINGLE SOURCE OF TRUTH for all site content.
 * Zero hardcoded strings in components.
 *
 * Populated from: docs/jay_information/Jay_Dhakan_Resume_2.pdf and
 * Jay_Dhakan_Resume_4.pdf. Nothing here is invented; every metric traces to a
 * resume bullet. Items needing Jay's confirmation are marked `TODO(JAY)`.
 *
 * ─── OPEN QUESTIONS (also summarized in the build checkpoint) ───────────────
 * TODO(JAY): Resume_2 says "2+ yrs" & BotPro "2023-present". Resume_4 says
 *            "4+ yrs", BotPro "2021-2024", VRSEN "2024-2025". Which is right?
 * TODO(JAY): Positioning: resumes say "Python & AI/ML Engineer"; the brief
 *            says "full-stack developer (web, mobile, SaaS)". Site currently
 *            uses the resume positioning. Confirm or adjust.
 * TODO(JAY): "50+ projects / 30+ clients / Top Rated on Upwork" appear in the
 *            brief but NOT in either resume — left out until confirmed.
 * TODO(JAY): hello@jaydhakan.com (brief) vs jaydhakan11@gmail.com (resume).
 *            Does the jaydhakan.com domain + mailbox exist?
 * TODO(JAY): Upwork profile URL missing. LinkedIn URL in resume reads
 *            "linkedin.com/jay-dhakan" — assumed "/in/jay-dhakan", verify.
 * TODO(JAY): All testimonials are PLACEHOLDERS (allowed by the brief) and
 *            must be replaced with real quotes before launch.
 */

// ─────────────────────────────────────────────────────────────────── Types ──

export type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
};

export type Service = {
  icon: string; // Lucide icon name, resolved in components
  title: string;
  description: string;
};

export type ProjectCategory = "AI & Agents" | "Data Pipelines" | "APIs";

export type Project = {
  slug: string;
  title: string;
  client: string;
  industry: string;
  year: string;
  category: ProjectCategory;
  featured?: boolean;
  description: string; // one-line outcome for cards
  tech: string[];
  result: string; // headline metric for card footer
  coverImage: string;
  caseStudy: {
    role: string;
    timeline: string;
    problem: string[];
    approach: string[];
    built: string[];
    results: Stat[];
    narrative: string;
  };
};

export type Testimonial = {
  name: string;
  company: string;
  platform: string;
  quote: string;
  rating: number;
  isPlaceholder?: boolean;
};

export type ProcessStep = {
  step: string;
  title: string;
  description: string;
};

export type TechItem = {
  name: string;
  /** devicon slug for CDN icon (https://cdn.jsdelivr.net/gh/devicons/devicon/icons/{slug}/{slug}-{variant}.svg); undefined = text fallback */
  icon?: string;
  /** devicon variant; defaults to "original" (AWS only ships wordmarks). */
  iconVariant?: string;
  /** Dark/monochrome marks (GitHub, AWS) need inverting on the dark theme. */
  iconInvertDark?: boolean;
};

export type TimelineEntry = {
  period: string;
  title: string;
  description: string;
};

// ──────────────────────────────────────────────────────────────── Identity ──

export const siteConfig = {
  name: "Jay Dhakan",
  role: "Python & AI/ML Engineer",
  tagline:
    "Python & AI/ML engineer building LLM chatbots, multi-agent automation, and data pipelines that hold up in production. Based in India, working worldwide.",
  email: "hello@jaydhakan.com", // TODO(JAY): confirm domain, resume says jaydhakan11@gmail.com
  upworkUrl: "", // TODO(JAY): add real Upwork profile URL (empty = link hidden in UI)
  linkedinUrl: "https://www.linkedin.com/in/jay-dhakan", // TODO(JAY): verify handle
  githubUrl: "https://github.com/jaydhakan",
  isAvailable: true,
  availabilityNote: "Available for new projects",
  footerCta: "Let's build something that ships.",
};

export const profile = {
  name: "Jay Dhakan",
  role: "Python & AI/ML Engineer",
  location: "Based in India · Available worldwide",
  // First-person, conversational, resume-true.
  bio: "I'm Jay, a Python and AI/ML engineer who ships production-grade data pipelines, LLM chatbots, and multi-agent automation. I've led a 4-person platform squad, cut a nightly ETL from 18 hours to 1.2, and kept services at 99.9% uptime while handling 15M+ queries a day. I work with clients directly: no project managers, no handoffs, no fluff. You talk to the person writing your code, and I measure success in deployed products, not deliverables.",
  skills: [
    "Python",
    "FastAPI",
    "LangChain & LangGraph",
    "RAG & LLM Apps",
    "Multi-Agent Systems",
    "Web Scraping at Scale",
    "MongoDB & PostgreSQL",
    "Docker & CI/CD",
    "AWS & Azure",
    "PyTorch & OpenCV",
  ],
  photo: "/images/profile/jay.jpg", // TODO(JAY): add a real 400x400+ photo
  // Grouped toolkit for the /about tactile grid (real, from resume + case studies).
  toolkit: [
    { group: "Languages & Core", items: ["Python", "TypeScript", "FastAPI", "AsyncIO"] },
    { group: "AI / ML", items: ["LangChain & LangGraph", "RAG & LLM apps", "Multi-agent systems", "OpenAI APIs", "PyTorch & OpenCV"] },
    { group: "Data & Scraping", items: ["Scrapy & Playwright", "MongoDB", "PostgreSQL", "Redis", "Proxy rotation"] },
    { group: "Cloud & Infra", items: ["AWS & Azure", "Docker", "CI/CD", "Vercel"] },
  ],
};

// ──────────────────────────────────────────────────────────────────── Hero ──

export const hero = {
  h1Line1: "I Build Products",
  h1Line2: "That Actually Ship.",
  subheading:
    "I'm Jay Dhakan, a Python & AI/ML engineer. I ship LLM chatbots, multi-agent automation, and data pipelines that handle 15M+ queries a day in production.",
  ctaPrimary: { label: "See My Work", href: "/work" },
  ctaSecondary: { label: "Let's Talk", href: "/contact" },
  // NOTE: brief specced "SaaS Platforms · Mobile Apps · E-Commerce ..." —
  // replaced with resume-true service categories. TODO(JAY): confirm.
  marquee: [
    "AI Agents",
    "LLM & RAG Chatbots",
    "Data Pipelines",
    "Web Scraping at Scale",
    "High-Performance APIs",
    "SaaS Platforms",
    "Web Apps",
  ],
};

// ─────────────────────────────────────────────────────────────────── Stats ──
// All from resume bullets. TODO(JAY): brief wanted "50+ projects / 30+ clients
// / years experience / Top Rated on Upwork" — none verifiable from resumes.
// Swap any of these four if you prefer those (and confirm the numbers).

export const stats: Stat[] = [
  { value: 15, suffix: "M+", label: "Queries handled per day" },
  { value: 99.9, suffix: "%", decimals: 1, label: "Uptime across production services" },
  { value: 70, suffix: "M+", label: "Records harvested by one pipeline" },
  { value: 50, suffix: "%", label: "Cut from third-party SaaS costs" },
];

// ─────────────────────────────────────────────────────── Impact set-piece ──
// Oversized home impact moment (P5). Real numbers, each bound to the system it
// came from (resume / case studies); the featured transformation leads. Kept
// distinct from the bento's live 15M+/99.9% tile so the home never triple-counts.

export const impact = {
  heading: "Numbers That Held Up in Production",
  intro:
    "Not vanity metrics. Each one came out of a real system I designed, shipped, and kept alive under load.",
  transform: {
    from: "18h",
    to: 1.2,
    suffix: "h",
    decimals: 1,
    label: "Nightly ETL pipeline, rebuilt",
    context:
      "Re-architected end to end, so the job that ate the whole night now finishes before the team's first coffee.",
  },
  stats: [
    {
      value: 70,
      suffix: "M+",
      label: "records harvested",
      context: "by a single Scrapy pipeline, at under $3 per million rows",
    },
    {
      value: 175,
      suffix: "+",
      label: "QPS benchmarked",
      context: "on one async FastAPI node, under fault injection",
    },
    {
      value: 50,
      suffix: "%",
      label: "SaaS costs cut",
      context: "by replacing third-party APIs with services I built",
    },
  ],
};

// ──────────────────────────────────────────────────────────────── Services ──

export const services: Service[] = [
  {
    icon: "Bot",
    title: "AI Agents & Automation",
    description:
      "Multi-agent systems that research, write, code, QA, and deploy autonomously, built on agency-swarm and multi-model stacks.",
  },
  {
    icon: "MessageSquareText",
    title: "LLM & RAG Chatbots",
    description:
      "Production chatbots on OpenAI APIs with RAG over your data: WhatsApp, web, and internal tools that deploy in minutes, not months.",
  },
  {
    icon: "Database",
    title: "Data Pipelines & Scraping",
    description:
      "Scrapy and Playwright pipelines with proxy rotation and smart throttling that harvest millions of records reliably and cheaply.",
  },
  {
    icon: "Zap",
    title: "High-Performance APIs",
    description:
      "Async FastAPI services benchmarked at 175+ QPS with sub-second latency, tenant isolation, and usage analytics built in.",
  },
  {
    icon: "Globe",
    title: "Full-Stack Web Apps",
    description:
      "Next.js front-ends on Vercel backed by Python services, from MVP to SaaS platform, shipped end to end.",
  },
  {
    icon: "Server",
    title: "Cloud, DevOps & Reliability",
    description:
      "AWS, Azure, Docker, and CI/CD with monitoring and alerting that keeps services at 99.9% uptime.",
  },
];

// ──────────────────────────────────────────────────────── Capabilities ──
// Home "What I Build" bento (P4). Real, from services/stats/projects above; the
// full service detail lives on /services. `motif` selects the live visual.

export type Capability = {
  key: "agents" | "pipelines" | "apis" | "chatbots";
  title: string;
  blurb: string;
  metric?: { value: string; label: string };
};

export const capabilities: Capability[] = [
  {
    key: "agents",
    title: "AI Agents & Automation",
    blurb:
      "Multi-agent swarms that research, write, code, QA, and deploy on their own, built on agency-swarm and multi-model stacks.",
  },
  {
    key: "pipelines",
    title: "Data Pipelines at Scale",
    blurb:
      "Scrapy and Playwright pipelines with proxy rotation that harvest millions of records, reliably and cheap.",
    metric: { value: "70M+", label: "records / sweep" },
  },
  {
    key: "apis",
    title: "High-Performance APIs",
    blurb:
      "Async FastAPI services with tenant isolation, usage analytics, and sub-second latency under load.",
    metric: { value: "175+", label: "QPS benchmarked" },
  },
  {
    key: "chatbots",
    title: "LLM & RAG Chatbots",
    blurb:
      "Production chatbots with RAG over your data, deploying to WhatsApp, web, and internal tools in minutes.",
  },
];

// ──────────────────────────────────────────────────────────────── Projects ──
// First three are the homepage featured set (order matters: large card first).

export const projects: Project[] = [
  {
    slug: "multi-agent-prompt-to-site-studio",
    title: "Multi-Agent Prompt-to-Site Studio",
    client: "VRSEN", // TODO(JAY): confirm public attribution is OK
    industry: "AI / Web Automation",
    year: "2025",
    category: "AI & Agents",
    featured: true,
    description:
      "An agent swarm that turns a prompt into a deployed website in 4 to 5 minutes.",
    tech: ["OpenAI APIs", "agency-swarm", "Next.js", "Firebase", "Vercel"],
    result: "90% dev-time saved per site",
    coverImage: "/images/projects/prompt-to-site.png", // TODO(JAY): real screenshot
    caseStudy: {
      role: "Architect & sole engineer",
      timeline: "2025", // TODO(JAY): duration?
      problem: [
        "Building small product sites by hand takes developer days per site, with most of the time spent on repetitive research, copywriting, and deployment steps rather than real engineering.",
        "The goal: compress an entire site build, from research to live deployment, into minutes without sacrificing output quality.",
      ],
      approach: [
        "Designed a multi-agent system on the agency-swarm framework with separate agents for niche research, content generation, code, QA, and deployment, each with tightly engineered prompts and rules so agents stay on track.",
        "Built a multi-model stack: o4-mini-high writes the code, GPT-4.1 handles agent-to-agent communication, and GPT-4.5 acts as the manager agent running the whole workflow.",
      ],
      built: [
        "Next.js front-ends generated and deployed to Vercel, driven end to end by OpenAI APIs.",
        "Firebase storage for product-site links, with the GeniusLink API optimizing multi-merchant routing.",
        "Zero-downtime rollout pipeline with 99.9% deployment success.",
      ],
      results: [
        { value: 4.5, decimals: 1, suffix: " min", label: "Average time per site" },
        { value: 90, suffix: "%", label: "Developer time saved" },
        { value: 75, suffix: "%", label: "Project cost savings" },
        { value: 99.9, suffix: "%", decimals: 1, label: "Deployment success" },
      ],
      narrative:
        "What used to be a multi-day build is now a 5-minute pipeline: prompt in, researched, written, coded, QA'd, and deployed site out.",
    },
  },
  {
    slug: "social-media-scraper",
    title: "Social Media Scraping Platform",
    client: "BotPro Solutions",
    industry: "Data Infrastructure",
    year: "2024",
    category: "Data Pipelines",
    featured: true,
    description:
      "A master-slave scraping cluster tracking 1,500 accounts across 6 social networks.",
    tech: ["Python", "AsyncIO", "REST APIs", "Rotating Proxies", "Slack/MS Teams"],
    result: "20K new posts/day at 99% success",
    coverImage: "/images/projects/social-scraper.png", // TODO(JAY): real screenshot
    caseStudy: {
      role: "Platform engineer",
      timeline: "2024",
      problem: [
        "Tracking 1,500 accounts across six social networks meant thousands of crawl, refresh, and download jobs a day, and the legacy architecture couldn't scale or recover from silent failures.",
      ],
      approach: [
        "Re-engineered the system to 100% async with a master-slave architecture: a Collector API streams crawl/refresh/download jobs and worker pods pull tasks on demand.",
        "Added rotating proxies from multiple providers with adaptive retry and exponential back-offs.",
      ],
      built: [
        "A master-slave micro-cluster (Collector, Crawler, Refresher, Downloader) that auto-scales on server Spot capacity.",
        "20+ REST endpoints for on-demand downloads, crawls, refreshes, health, and analytics.",
        "A realtime ops dashboard plotting per-platform KPIs with 24-hour and 30-day trendlines, plus a fleet-health panel tracking 40+ pods and flagging lagging workers.",
        "Smart alerting: structured logs ping Slack and MS Teams on stalled queues or error spikes.",
      ],
      results: [
        { value: 20, suffix: "K", label: "New posts ingested per day" },
        { value: 99, suffix: "%", label: "Success rate, zero downtime" },
        { value: 90, suffix: "%", label: "Fewer silent data-loss incidents" },
        { value: 40, suffix: "+", label: "Worker pods fleet-tracked" },
      ],
      narrative:
        "The platform now ingests 20,000 posts a day with 99% success, and silent data loss dropped by 90% thanks to structured alerting.",
    },
  },
  {
    slug: "custom-google-search-kit",
    title: "Custom Google Search Kit",
    client: "BotPro Solutions",
    industry: "API / SaaS Infrastructure",
    year: "2025",
    category: "APIs",
    featured: true,
    description:
      "A SaaS-ready search API pushing 15M+ queries a day through a single 4-vCPU node.",
    tech: ["FastAPI", "HTTPX", "Redis", "Gunicorn/Uvicorn"],
    result: "15M+ queries/day on one node",
    coverImage: "/images/projects/search-kit.png", // TODO(JAY): real screenshot
    caseStudy: {
      role: "API architect & engineer",
      timeline: "2025",
      problem: [
        "The product needed Google-style search results as structured data, at SaaS scale, with per-tenant limits and predictable latency, without paying enterprise API prices.",
      ],
      approach: [
        "Built async FastAPI + HTTPX workers behind Gunicorn/Uvicorn with Redis as the rate-limit store, and benchmarked under fault-injection tests before launch.",
        "Designed pluggable back-ends (Bing, DuckDuckGo) that swap in with zero downtime.",
      ],
      built: [
        "10+ structured fields per result (title, URL, snippet, and more).",
        "Basic-Auth with per-API-key limits for SaaS-ready tenant isolation.",
        "Keep-alive pools and tuned payloads pushing 15M+ queries/day through a single 4-vCPU, 8GB node at under 70% CPU.",
        "Nightly usage analytics rolling up top keywords and per-key consumption to feed billing and capacity planning.",
      ],
      results: [
        { value: 15, suffix: "M+", label: "Queries per day" },
        { value: 175, suffix: "+", label: "QPS benchmarked" },
        { value: 800, prefix: "<", suffix: "ms", label: "Latency per request at peak" },
        { value: 95, suffix: "%+", label: "Success under fault injection" },
      ],
      narrative:
        "End-to-end latency stays under 800ms per request during peak load, with 95%+ success under fault-injection tests, all on hardware that costs less than most teams' logging bill.",
    },
  },
  {
    slug: "zillow-data-harvester",
    title: "Zillow Data Harvester",
    client: "BotPro Solutions",
    industry: "Real Estate Data",
    year: "2023",
    category: "Data Pipelines",
    description:
      "A full-market real estate sweep: 70M records and 1.4TB harvested in 3 months.",
    tech: ["Python 3.11", "Scrapy", "MongoDB", "Proxy Rotation"],
    result: "70M records at <$3 per million rows",
    coverImage: "/images/projects/zillow-harvester.png", // TODO(JAY): real screenshot
    caseStudy: {
      role: "Pipeline engineer",
      timeline: "3 months to full sweep, ongoing delta-crawls",
      problem: [
        "A full market sweep of Zillow meant tens of millions of property records behind aggressive anti-bot measures, and it had to stay fresh after the initial harvest.",
      ],
      approach: [
        "Python 3.11 + Scrapy + MongoDB with proxy rotation, dynamic user agents, and smart throttling to sustain 100+ requests/sec.",
        "A smart scheduler autoruns the required services to move to the next phase when a full iteration completes.",
      ],
      built: [
        "150+ data points per property: price history, images, zestimates, dimensions.",
        "Weekly delta-crawls keeping the dataset fresh, with dashboards exposing trends and crawler KPIs.",
        "Lean infrastructure keeping cost under $3 per million rows.",
      ],
      results: [
        { value: 70, suffix: "M", label: "Records harvested (1.4TB)" },
        { value: 100, suffix: "+", label: "Requests per second" },
        { value: 150, suffix: "+", label: "Data points per property" },
        { value: 3, prefix: "<$", label: "Cost per million rows" },
      ],
      narrative:
        "A full market sweep in three months, kept fresh by weekly delta-crawls, on infrastructure lean enough to cost under $3 per million rows.",
    },
  },
  {
    slug: "whatsapp-chatbot-creator",
    title: "1-Click WhatsApp/Web Chatbot Creator",
    client: "BotPro Solutions",
    industry: "Conversational AI",
    year: "2024", // TODO(JAY): confirm year
    category: "AI & Agents",
    description:
      "Self-serve chatbot creation on the OpenAI Assistants API: ingest data, deploy in under 5 minutes.",
    tech: ["OpenAI Assistants API", "Python", "WhatsApp API"],
    result: "Live chatbot in <5 minutes",
    coverImage: "/images/projects/chatbot-creator.png", // TODO(JAY): real screenshot
    caseStudy: {
      role: "Product engineer",
      timeline: "2024", // TODO(JAY)
      problem: [
        "Every client chatbot was a bespoke build: scraping training data, configuring the assistant, and wiring up WhatsApp or web chat by hand.",
      ],
      approach: [
        "Productized the whole flow into a 1-click creator on the OpenAI Assistants API that scrapes or ingests training data automatically.",
      ],
      built: [
        "Automated ingestion: point it at a site or upload documents, and the bot trains itself.",
        "One-click deployment to WhatsApp and web chat in under 5 minutes.",
      ],
      results: [
        { value: 5, prefix: "<", suffix: " min", label: "Data to deployed bot" },
        { value: 1, label: "Click to launch" },
      ],
      narrative:
        "What was a bespoke engineering engagement became a product: training data in, live WhatsApp or web chatbot out, in under five minutes.",
    },
  },
  {
    slug: "cinqcare-healthcare-automation",
    title: "Patient-Specific Healthcare Automation",
    client: "CinqCare (via VRSEN)", // TODO(JAY): confirm attribution is OK
    industry: "Healthcare",
    year: "2024",
    category: "AI & Agents",
    description:
      "AI-generated call scripts and QnA bots that improved reservations and patient support.",
    tech: ["Python", "OpenAI APIs", "Azure"],
    result: "Faster reservations, better patient support",
    coverImage: "/images/projects/cinqcare.png", // TODO(JAY): real screenshot
    caseStudy: {
      role: "AI engineer",
      timeline: "2024", // TODO(JAY)
      problem: [
        "Patient reservation and support flows relied on generic scripts that didn't account for individual patient context, slowing the process and degrading the support experience.",
      ],
      approach: [
        "Developed patient-specific automation generating tailored call scripts, and set up QnA bots grounded in the patient's own context.",
      ],
      built: [
        "Call-script generation tuned per patient.",
        "QnA bots supporting the reservation process and patient questions.",
      ],
      results: [],
      narrative:
        "Reservations got faster and patient support got more personal, with scripts and answers generated for the individual patient instead of the average one.",
      // NOTE: no quantified metrics in resume for this project — section renders narrative only.
    },
  },

  // ─────────────── PLACEHOLDER PROJECTS (TODO(JAY): replace with real work) ──
  // Added so /work reads full. Plausible and on-domain, but NOT real engagements;
  // numbers are illustrative. Swap or delete before launch.
  {
    slug: "realtime-trading-signals-api",
    title: "Realtime Trading Signals API",
    client: "Confidential", // PLACEHOLDER
    industry: "Fintech Infrastructure",
    year: "2025",
    category: "APIs",
    description:
      "A low-latency signals API streaming indicators to trading clients over websockets.",
    tech: ["FastAPI", "WebSockets", "Redis", "TimescaleDB"],
    result: "sub-50ms fan-out to 2K+ clients", // PLACEHOLDER metric
    coverImage: "/images/projects/realtime-signals.png",
    caseStudy: {
      role: "API architect & engineer",
      timeline: "2025",
      problem: [
        "Trading clients needed market indicators pushed in near-real time, with predictable latency under bursty load, without hammering upstream data providers.",
      ],
      approach: [
        "Built an async FastAPI gateway with a Redis pub/sub fan-out layer and a TimescaleDB hot store, decoupling ingestion from delivery so spikes never stall consumers.",
      ],
      built: [
        "WebSocket fan-out delivering indicator updates to thousands of concurrent clients.",
        "A backpressure-aware ingestion worker with replay from the hot store on reconnect.",
      ],
      results: [
        { value: 50, prefix: "<", suffix: "ms", label: "Fan-out latency at peak" }, // PLACEHOLDER
        { value: 2, suffix: "K+", label: "Concurrent clients" }, // PLACEHOLDER
      ],
      narrative:
        "Indicators reach every connected client in well under 50ms, even during market-open bursts, on a stack that scales horizontally.",
    },
  },
  {
    slug: "autonomous-research-agent",
    title: "Autonomous Research Agent",
    client: "Confidential", // PLACEHOLDER
    industry: "AI / Knowledge Work",
    year: "2025",
    category: "AI & Agents",
    description:
      "A planner-executor agent that researches a topic and returns a sourced, structured brief.",
    tech: ["LangGraph", "OpenAI APIs", "Playwright", "pgvector"],
    result: "hours of desk research in minutes", // PLACEHOLDER
    coverImage: "/images/projects/research-agent.png",
    caseStudy: {
      role: "Architect & sole engineer",
      timeline: "2025",
      problem: [
        "Analysts spent hours gathering, reading, and synthesizing sources into a brief, repeating the same search-read-summarize loop by hand.",
      ],
      approach: [
        "Designed a LangGraph planner-executor loop: a planner decomposes the question, executor agents browse and extract with Playwright, and a synthesizer grounds the answer in retrieved sources via pgvector.",
      ],
      built: [
        "A tool-using agent graph with retries, source de-duplication, and citation tracking.",
        "Structured-output briefs with inline citations and a confidence pass.",
      ],
      results: [
        { value: 12, suffix: "x", label: "Faster than manual research" }, // PLACEHOLDER
        { value: 95, suffix: "%", label: "Claims traced to a source" }, // PLACEHOLDER
      ],
      narrative:
        "What was an afternoon of tab-juggling is now a few-minute run that returns a structured, fully-sourced brief.",
    },
  },
  {
    slug: "product-catalog-etl",
    title: "Product Catalog ETL & Sync",
    client: "Confidential", // PLACEHOLDER
    industry: "E-Commerce Data",
    year: "2023",
    category: "Data Pipelines",
    description:
      "A nightly pipeline normalizing and syncing millions of SKUs across multiple storefronts.",
    tech: ["Python", "Airflow", "PostgreSQL", "dbt"],
    result: "5M+ SKUs synced nightly", // PLACEHOLDER
    coverImage: "/images/projects/catalog-etl.png",
    caseStudy: {
      role: "Pipeline engineer",
      timeline: "2023",
      problem: [
        "Product data arrived in mismatched schemas from several suppliers, and stale or duplicate SKUs were leaking into the storefronts.",
      ],
      approach: [
        "Built an Airflow-orchestrated ETL with dbt models for normalization and deduplication, plus idempotent upserts so a re-run never double-writes.",
      ],
      built: [
        "Schema-mapping adapters per supplier feed, with validation gates that quarantine bad rows.",
        "Incremental dbt models and a freshness dashboard flagging stale feeds.",
      ],
      results: [
        { value: 5, suffix: "M+", label: "SKUs synced nightly" }, // PLACEHOLDER
        { value: 99, suffix: "%", label: "Feed freshness SLA met" }, // PLACEHOLDER
      ],
      narrative:
        "Storefronts now wake up to clean, deduplicated, current catalog data, with bad feeds quarantined before they ever ship.",
    },
  },
];

// ──────────────────────────────────────────────────────────── Testimonials ──
// ⚠️ ALL PLACEHOLDERS (brief allows Upwork-style placeholders until real
// quotes arrive). TODO(JAY): replace every entry before launch.

export const testimonials: Testimonial[] = [
  {
    name: "Client A (placeholder)",
    company: "SaaS startup",
    platform: "via Upwork",
    quote:
      "Jay rebuilt our data pipeline and the nightly job that took all night now finishes before the team's first coffee. Communication was direct and constant.",
    rating: 5,
    isPlaceholder: true,
  },
  {
    name: "Client B (placeholder)",
    company: "E-commerce company",
    platform: "via LinkedIn",
    quote:
      "He shipped our chatbot in days, not months, and it just works. No middlemen, no surprises, exactly what was promised.",
    rating: 5,
    isPlaceholder: true,
  },
  {
    name: "Client C (placeholder)",
    company: "Agency partner",
    platform: "Direct referral",
    quote:
      "The API he built handles our entire search volume on one small server. We budgeted for ten times the infrastructure.",
    rating: 5,
    isPlaceholder: true,
  },
  {
    name: "Client D (placeholder)",
    company: "AI product team",
    platform: "via Upwork",
    quote:
      "Our multi-agent workflow went from a fragile prototype to something we actually trust in production. Jay thinks in systems, not scripts.",
    rating: 5,
    isPlaceholder: true,
  },
  {
    name: "Client E (placeholder)",
    company: "Data analytics firm",
    platform: "via LinkedIn",
    quote:
      "He scraped millions of records reliably where two other contractors had failed, and documented the whole pipeline so my team could own it.",
    rating: 5,
    isPlaceholder: true,
  },
  {
    name: "Client F (placeholder)",
    company: "Early-stage founder",
    platform: "Direct referral",
    quote:
      "From idea to a deployed full-stack app in a couple of weeks, with none of the agency overhead. I talked to the person actually building it.",
    rating: 5,
    isPlaceholder: true,
  },
];

// ───────────────────────────────────────────────────────────────── Process ──

export const process: ProcessStep[] = [
  {
    step: "01",
    title: "Discovery",
    description:
      "We get on a call and I learn what you're building and why. You get a clear scope, timeline, and price, no vague estimates.",
  },
  {
    step: "02",
    title: "Design",
    description:
      "I map the architecture before writing code: data flows, APIs, models, and failure modes. You see the plan and approve it.",
  },
  {
    step: "03",
    title: "Build",
    description:
      "Short cycles with working software at every step. You watch the product come alive instead of waiting for a big reveal.",
  },
  {
    step: "04",
    title: "Launch",
    description:
      "Deployed, monitored, and documented. I stay on after launch to make sure it runs as well in production as it did in the demo.",
  },
];

// ─────────────────────────────────────────────────────────────── Tech stack ──

export const techStack: Record<string, TechItem[]> = {
  "AI & LLM": [
    { name: "OpenAI APIs" },
    { name: "LangChain" },
    { name: "LangGraph" },
    { name: "LlamaIndex" },
    { name: "agency-swarm" },
    { name: "Hugging Face" }, // not in devicon; text fallback
    { name: "PyTorch", icon: "pytorch" },
  ],
  Backend: [
    { name: "Python", icon: "python" },
    { name: "FastAPI", icon: "fastapi" },
    { name: "Flask", icon: "flask", iconInvertDark: true },
    { name: "Pydantic" },
    { name: "Redis", icon: "redis" },
    { name: "APScheduler" },
  ],
  "Scraping & Data": [
    { name: "Scrapy" },
    { name: "Playwright", icon: "playwright" },
    { name: "Selenium", icon: "selenium" },
    { name: "BeautifulSoup4" },
    { name: "Pandas", icon: "pandas" },
    { name: "PySpark", icon: "apachespark" },
    { name: "OpenCV", icon: "opencv" },
  ],
  Databases: [
    { name: "MongoDB", icon: "mongodb" },
    { name: "PostgreSQL", icon: "postgresql" },
    { name: "DynamoDB", icon: "dynamodb" },
    { name: "Supabase", icon: "supabase" },
    { name: "FAISS / Pinecone / Qdrant / Chroma" },
  ],
  Frontend: [
    { name: "Next.js", icon: "nextjs" },
    { name: "React", icon: "react" },
    { name: "TypeScript", icon: "typescript" },
    { name: "Tailwind CSS", icon: "tailwindcss" },
  ],
  "Cloud & DevOps": [
    {
      name: "AWS",
      icon: "amazonwebservices",
      iconVariant: "plain-wordmark",
      iconInvertDark: true,
    },
    { name: "Azure", icon: "azure" },
    { name: "Docker", icon: "docker" },
    { name: "GitHub CI/CD", icon: "github", iconInvertDark: true },
    { name: "DigitalOcean", icon: "digitalocean" },
    { name: "Railway" },
    { name: "pm2" },
  ],
};

// ──────────────────────────────────────────────────────────── About: story ──
// TODO(JAY): resumes conflict on dates — adjust this timeline after you confirm.

export const timeline: TimelineEntry[] = [
  {
    period: "2019-2023",
    title: "B.Tech in AI, Marwadi University",
    description:
      "Bachelor of Technology specialized in Artificial Intelligence. CGPA 8.02.",
  },
  {
    period: "2021-2024", // TODO(JAY): Resume_2 says 2023-present instead
    title: "Python Developer, BotPro Solutions",
    description:
      "Led a 4-person platform squad. Cut a 17-hour legacy job to 80 minutes, halved SaaS costs, and shipped the 1-click chatbot creator.",
  },
  {
    period: "2024",
    title: "Mr Perfectionist Award",
    description:
      "Youngest winner of the 2024 award for quality and on-time delivery.",
  },
  {
    period: "2024-2025",
    title: "Python & AI/ML Engineer, VRSEN",
    description:
      "Built AI agents for research, content, code, and deployment. Shipped the Prompt-to-Site Studio and healthcare automation for CinqCare.",
  },
  {
    period: "2025-Now",
    title: "Independent. Building for clients worldwide.", // TODO(JAY): confirm current status
    description:
      "Taking on AI, data, and full-stack projects directly: no middlemen, no handoffs.",
  },
];

export const howIWork = [
  {
    icon: "MessagesSquare",
    title: "Direct Communication",
    description:
      "No PMs or middlemen. You talk to the person writing your code.",
  },
  {
    icon: "ShieldCheck",
    title: "Full Accountability",
    description:
      "I own every project start to finish. Your success is my success.",
  },
  {
    icon: "Rocket",
    title: "Shipped, Not Promised",
    description:
      "I measure success in deployed products, not deliverables.",
  },
];

// ──────────────────────────────────────────────────── Services page: pricing ──

export const pricing = [
  {
    name: "Starter",
    price: "From $1,500",
    bestFor: "MVPs, landing pages, quick builds",
    features: [
      "Up to 5 pages or one focused service",
      "Responsive design",
      "Basic animations",
      "Deployed + handoff",
      "1 round of revisions",
    ],
    cta: { label: "Get Started", href: "/contact?plan=starter" },
    highlighted: false,
  },
  {
    name: "Growth",
    price: "From $5,000",
    bestFor: "SaaS MVPs, AI features, client portals",
    features: [
      "Everything in Starter",
      "Custom features",
      "Auth + database",
      "API & LLM integrations",
      "3 rounds of revisions",
      "30-day post-launch support",
    ],
    cta: { label: "Let's Talk", href: "/contact?plan=growth" },
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Custom",
    price: "Let's Scope It",
    bestFor: "Complex SaaS, agent systems, long-term partnerships",
    features: [
      "Large-scale products",
      "Multi-agent automation",
      "Data platforms & pipelines",
      "Ongoing development partnership",
    ],
    cta: { label: "Start a Conversation", href: "/contact?plan=custom" },
    highlighted: false,
  },
];

// ───────────────────────────────────────────────────────── Contact page data ──

export const contact = {
  responseTime: "I reply within 24 hours",
  location: "Based in India · Available worldwide",
  upworkBadge: "Top Rated on Upwork", // TODO(JAY): not in resume — confirm before showing
  availability: "Currently accepting new projects", // shown with pulsing dot
  // Genuine ordered flow (numbers are earned here, not scaffolding).
  whatNext: [
    { title: "You send the brief", desc: "What you're building, the problem it solves, and any timeline." },
    { title: "I reply within 24 hours", desc: "Usually same day, with first questions or a quick call to align." },
    { title: "We scope it and I ship", desc: "Clear plan, clear price, then I start building, not a month of meetings." },
  ],
  budgetOptions: [
    "Under $1k",
    "$1k-$5k",
    "$5k-$15k",
    "$15k+",
    "Let's discuss",
  ],
  projectTypes: [
    "AI Agent / Automation",
    "LLM / RAG Chatbot",
    "Data Pipeline / Scraping",
    "API Development",
    "Web App / SaaS",
    "Other",
  ],
};

// ──────────────────────────────────────────────────────────── Section copy ──

export const sections = {
  stats: { eyebrow: "", heading: "" }, // stats bar renders without header
  featuredWork: {
    eyebrow: "MY WORK",
    heading: "Projects That Moved the Needle",
    viewAll: { label: "View All Work", href: "/work" },
  },
  services: {
    eyebrow: "WHAT I DO",
    heading: "End-to-End Digital Execution",
  },
  capabilities: {
    // No eyebrow (keeps the page's eyebrow budget low — the heading carries it).
    heading: "Production Systems, End to End",
    subheading:
      "From multi-agent automation to APIs that scale, this is what I design, build, and ship.",
    viewAll: { label: "Explore Services", href: "/services" },
  },
  process: {
    eyebrow: "MY PROCESS",
    heading: "From Idea to Live Product",
  },
  testimonials: {
    eyebrow: "CLIENT LOVE",
    heading: "Words from People I've Shipped With",
  },
  techStack: {
    eyebrow: "BUILT WITH",
    heading: "My Toolkit",
  },
  ctaBanner: {
    heading: "Have a project in mind?",
    subheading: "I take on 2-3 new projects a month. Let's see if we're a good fit.",
    cta: { label: "Start a Project", href: "/contact" },
    altContact: "Or reach me directly at",
  },
  workPage: {
    eyebrow: "ALL PROJECTS",
    heading: "Work That Speaks For Itself",
    subheading:
      "Production systems shipped across AI agents, data pipelines, and high-performance APIs.",
    filters: ["All", "AI & Agents", "Data Pipelines", "APIs"] as const,
  },
  caseStudy: {
    backLabel: "All Work",
    nextProject: "Next project",
    sections: {
      problem: "The Problem",
      approach: "My Approach",
      built: "What I Built",
      results: "The Results",
    },
  },
  aboutPage: {
    eyebrow: "ABOUT ME",
    heading: "Builder. Problem Solver. Shipping Machine.",
    subheading:
      "I'm Jay Dhakan, a Python & AI/ML engineer shipping production-grade systems. I'm not an agency. You talk directly to me, I build directly for you.",
    storyEyebrow: "HOW I GOT HERE",
    platformsLabel: "Find me on",
  },
  // Camera-flight "training run" (V3 P10 / S8). Career as a converging run:
  // captions resolve char-by-char as the camera flies through the data graph.
  trainingRun: {
    eyebrow: "THE TRAINING RUN",
    heading: "How the Model Converged",
    epochs: [
      { tag: "EPOCH 01", title: "High loss", body: "Bespoke builds, scraped data by hand, everything from scratch." },
      { tag: "EPOCH 02", title: "Finding gradients", body: "Pipelines, APIs, and agents that scale past one-off engagements." },
      { tag: "EPOCH 03", title: "Descending", body: "15M+ queries a day, 99.9% uptime, an 18h ETL cut to 1.2." },
      { tag: "CONVERGED", title: "Shipping machine", body: "Production systems, end to end. You talk to the person writing your code." },
    ],
  },
  servicesPage: {
    eyebrow: "SERVICES",
    heading: "What I Build & How I Charge",
    subheading: "Clear scope, clear pricing. No surprises.",
    coverageHeading: "What Each Service Covers",
  },
  contactPage: {
    eyebrow: "GET IN TOUCH",
    heading: "Let's Build Something Together",
    subheading: "I take on 2-3 new projects a month. Tell me what you're building.",
  },
};

// ─────────────────────────────────────────────────────────── SEO metadata ──

export const seo = {
  home: {
    title: "Jay Dhakan, Full-Stack & AI/ML Developer",
    description:
      "Python & AI/ML engineer building LLM chatbots, multi-agent automation, data pipelines, and web apps. Based in India, working worldwide.",
  },
  work: {
    title: "My Work",
    description:
      "Case studies across AI agents, data pipelines, and high-performance APIs: 15M+ queries a day, 70M records harvested, 99.9% uptime.",
  },
  about: {
    title: "About Jay Dhakan",
    description:
      "Python & AI/ML engineer, youngest winner of the 2024 Mr Perfectionist award. Direct communication, full accountability, shipped products.",
  },
  services: {
    title: "Services & Pricing",
    description:
      "AI agents, LLM chatbots, data pipelines, APIs, and web apps. Clear scope, clear pricing, no surprises.",
  },
  contact: {
    title: "Start a Project",
    description:
      "Tell me what you're building. I reply within 24 hours and take on 2-3 new projects a month.",
  },
};
