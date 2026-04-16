export const resumeData = {
  personal: {
    name: "Alex Morgan",
    title: "Full-Stack Engineer",
    taglines: [
      "Full-Stack Engineer",
      "Open Source Contributor",
      "System Architect",
      "Problem Solver",
      "Tech Enthusiast",
    ],
    email: "farisatif7780@gmail.com",
    phone: "+967778088098",
    whatsapp: "967778088098",
    location: "San Francisco, CA",
    github: "github.com/alexmorgan",
    linkedin: "linkedin.com/in/alexmorgan",
    website: "alexmorgan.dev",
    bio: "I build scalable systems and elegant user experiences. Passionate about open source, distributed systems, and pushing what's possible on the web. Currently focused on developer tooling and infrastructure at scale.",
    avatar: null,
    stats: {
      commits: 2847,
      repos: 63,
      followers: 1204,
      stars: 4891,
    },
  },

  skills: [
    { id: "react", name: "React", level: 95, category: "Frontend" },
    { id: "typescript", name: "TypeScript", level: 92, category: "Language" },
    { id: "nodejs", name: "Node.js", level: 88, category: "Backend" },
    { id: "python", name: "Python", level: 85, category: "Language" },
    { id: "graphql", name: "GraphQL", level: 80, category: "API" },
    { id: "postgres", name: "PostgreSQL", level: 83, category: "Database" },
    { id: "docker", name: "Docker", level: 78, category: "DevOps" },
    { id: "kubernetes", name: "Kubernetes", level: 70, category: "DevOps" },
    { id: "rust", name: "Rust", level: 60, category: "Language" },
    { id: "go", name: "Go", level: 65, category: "Language" },
    { id: "redis", name: "Redis", level: 75, category: "Database" },
    { id: "aws", name: "AWS", level: 80, category: "Cloud" },
    { id: "nextjs", name: "Next.js", level: 90, category: "Frontend" },
    { id: "tailwind", name: "Tailwind CSS", level: 93, category: "Frontend" },
    { id: "git", name: "Git", level: 96, category: "Tool" },
    { id: "linux", name: "Linux", level: 87, category: "Tool" },
  ],

  languages: [
    { name: "TypeScript", percent: 42, color: "#3178c6" },
    { name: "Python", percent: 22, color: "#8b8b8b" },
    { name: "Rust", percent: 14, color: "#b0b0b0" },
    { name: "Go", percent: 12, color: "#c0c0c0" },
    { name: "Other", percent: 10, color: "#555555" },
  ],

  experience: [
    {
      company: "Vercel",
      role: "Senior Software Engineer",
      period: "2022 – Present",
      location: "Remote",
      description:
        "Leading the Edge Runtime team, building infrastructure that serves 10B+ requests/month across 100+ regions. Architected the new Edge Middleware system adopted by 50k+ projects.",
      highlights: [
        "Reduced cold start latency by 73% through WASM optimization",
        "Built distributed tracing system handling 1M+ spans/sec",
        "Led migration of 200+ internal services to Edge-native architecture",
      ],
    },
    {
      company: "Stripe",
      role: "Software Engineer II",
      period: "2019 – 2022",
      location: "San Francisco, CA",
      description:
        "Worked on the Payments infrastructure team, building reliable payment processing systems that handle billions of dollars annually.",
      highlights: [
        "Designed idempotency key system reducing duplicate payments by 99.7%",
        "Implemented real-time fraud detection reducing chargebacks by 40%",
        "Mentored 6 junior engineers through structured growth programs",
      ],
    },
    {
      company: "GitHub",
      role: "Software Engineer",
      period: "2017 – 2019",
      location: "San Francisco, CA",
      description:
        "Core contributor to GitHub Actions and the developer experience platform.",
      highlights: [
        "Built the initial GitHub Actions execution engine",
        "Improved PR diff rendering performance by 5x",
        "Shipped GitHub Sponsors payment integration",
      ],
    },
  ],

  projects: [
    {
      name: "turborepo-analyzer",
      description:
        "CLI tool for visualizing and optimizing Turborepo build graphs. Helps teams identify bottlenecks and reduce CI times by 40%+.",
      stars: 2341,
      forks: 187,
      language: "TypeScript",
      tags: ["CLI", "Build Tools", "Open Source"],
      url: "github.com/alexmorgan/turborepo-analyzer",
    },
    {
      name: "edge-kv",
      description:
        "Zero-latency key-value store designed for edge computing environments. Supports CRDT-based conflict resolution for distributed writes.",
      stars: 1876,
      forks: 143,
      language: "Rust",
      tags: ["Edge", "Distributed", "CRDT"],
      url: "github.com/alexmorgan/edge-kv",
    },
    {
      name: "react-signals",
      description:
        "Fine-grained reactivity system for React inspired by SolidJS signals. Zero overhead subscription model with automatic dependency tracking.",
      stars: 3201,
      forks: 254,
      language: "TypeScript",
      tags: ["React", "State Management", "Performance"],
      url: "github.com/alexmorgan/react-signals",
    },
    {
      name: "sqlpilot",
      description:
        "AI-powered SQL query optimizer that analyzes execution plans and suggests index improvements. Integrates with PostgreSQL and MySQL.",
      stars: 892,
      forks: 67,
      language: "Python",
      tags: ["AI", "Database", "DevTools"],
      url: "github.com/alexmorgan/sqlpilot",
    },
  ],

  education: [
    {
      school: "MIT",
      degree: "B.S. Computer Science",
      period: "2013 – 2017",
      gpa: "3.9",
      highlights: ["Thesis: Distributed consensus in Byzantine environments", "ACM ICPC Regional Finalist"],
    },
  ],

  contributions: generateContributionData(),
};

function generateContributionData() {
  const weeks = 53;
  const days = 7;
  const data = [];
  for (let w = 0; w < weeks; w++) {
    const week = [];
    for (let d = 0; d < days; d++) {
      const rand = Math.random();
      let count = 0;
      if (rand > 0.4) {
        if (rand > 0.9) count = Math.floor(Math.random() * 10) + 8;
        else if (rand > 0.75) count = Math.floor(Math.random() * 6) + 4;
        else count = Math.floor(Math.random() * 3) + 1;
      }
      week.push(count);
    }
    data.push(week);
  }
  return data;
}
