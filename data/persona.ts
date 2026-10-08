
export const persona = {
  // ============================================================
  // IDENTITY
  // ============================================================
  name: "Waleed Badshah",
  preferredName: "Waleed",
  role: "Full-Stack MERN Developer & Software Developer",
  eyebrow: "Digital Web Solutions Provider",
  eyebrowColor: "#3b82f6",
  tagline:
    "Creating stunning digital experiences with modern web technologies.",
  logo: "/logo.png",
  avatar: "/avatar.jpg",

  location: {
    country: "Pakistan",
    city: "Islamabad",
    full: "Islamabad, Pakistan",
  },

  // ============================================================
  // ABOUT
  // ============================================================
  about: `
    Waleed Badshah is a Full-Stack Web Developer and Software Developer
    based in Islamabad, Pakistan. He holds a BS in Information Technology
    from the University of Malakand (2020–2024, CGPA 3.79) and currently
    works at Deister Software as a Software Developer, contributing to
    enterprise-level database-driven applications and business intelligence
    solutions.

    He specializes in the MERN stack (MongoDB, Express.js, React.js, Node.js)
    with hands-on experience in REST APIs, JWT authentication, RBAC,
    WebSockets, Docker, MySQL, PostgreSQL, and payment integrations.

    Beyond his professional role, he works with U.S.-based client Henry
    Golatt on the Drones Directory and OmniForce Vector initiatives, and
    is the founder of HAMAMA Perfumes, an upcoming fragrance brand.
  `.trim(),

  // ============================================================
  // EDUCATION
  // ============================================================
  education: [
    {
      institution: "Lalazar Public School",
      level: "Play Group – Grade 5",
    },
    {
      institution: "Dr. A.Q. Khan School",
      level: "Grade 5 – Grade 8",
    },
    {
      institution: "The Educators School",
      level: "Grade 9 – Grade 10 (SSC)",
      achievement: "Topper of his class in 2018",
    },
    {
      institution: "Ghandhara College",
      level: "HSSC",
      period: "Completed 2020",
    },
    {
      institution: "University of Malakand",
      degree: "BS Information Technology (BS-IT)",
      admission: "25 October 2020",
      completion: "August 2024",
      period: "2020 – 2024",
      cgpa: "3.79",
    },
  ],

  // ============================================================
  // CAREER
  // ============================================================
  experience: [
    {
      company: "Deister Software",
      role: "Software Developer",
      location: "Pakistan",
      period: "November 2025 – Present",
      current: true,
      summary:
        "Deister Software is a global provider of enterprise-level business solutions, including modular and scalable ERP, CRM, WMS and low-code platforms. Waleed contributes as a Software Developer to database-centric web applications and enterprise software solutions for clients across logistics, healthcare, retail and services.",
      project: {
        name: "Smart Mall System",
        description:
          "A data-driven mall management application built on the Airtool platform for mall administrators and decision-makers.",
        features: [
          "Analytical dashboards",
          "Data cards and advanced charts",
          "Data visualization",
          "Trend management",
          "Automation, triggers, and alerts",
          "Reporting",
          "SQL-based analytical grids",
        ],
      },
    },
    {
      company: "Code Alpha",
      role: "Full MERN Stack Developer",
      location: "Remote",
      period: "March 2025 – August 2025",
      summary:
        "Worked as a MERN Stack Developer focusing on efficient, scalable and user-friendly web applications. Responsibilities included React.js, Node.js, Express.js and MongoDB development, responsive web applications, RESTful APIs, JWT authentication, authorization, API optimization, testing, debugging, deployment and performance improvements.",
    },
    {
      company: "TechSol Labs Pakistan",
      role: "Full-Stack Developer Intern",
      location: "Pakistan",
      period: "August 2024 – January 2025",
      summary:
        "TechSol Labs is an IT servicing and consulting company. Worked on developing interactive, user-friendly and responsive web applications. Responsibilities included React.js and Node.js development, building RESTful APIs, JWT authentication, authorization, Express.js API development, UI/UX consistency, mobile responsiveness, cross-functional collaboration and deployment.",
    },
  ],

  // ============================================================
  // SKILLS
  // ============================================================
  skills: {
    frontend: ["React.js", "HTML5", "CSS3", "Bootstrap 5", "Tailwind CSS"],
    backend: [
      "Node.js",
      "Express.js",
      "REST APIs",
      "JWT Authentication",
      "RBAC",
      "WebSockets",
      "Jest",
    ],
    database: ["MongoDB", "Mongoose", "MySQL", "PostgreSQL"],
    tools: [
      "Git",
      "GitHub",
      "Docker",
      "AI Automation",
      "Payment Integration",
      "Version Control",
    ],
    deployment: ["AWS", "Vercel", "Hostinger", "GoDaddy", "Railway", "Render"],
  },

  skillList: [
    "React.js",
    "Node.js",
    "Express.js",
    "MongoDB",
    "Mongoose",
    "MySQL",
    "PostgreSQL",
    "REST APIs",
    "JWT Authentication",
    "RBAC",
    "WebSockets",
    "Jest",
    "Docker",
    "AI Automation",
    "Payment Integration",
    "Git",
    "GitHub",
    "AWS",
    "Vercel",
    "Hostinger",
    "GoDaddy",
    "Railway",
    "Render",
  ],

  softSkills: [
    "Communication",
    "Time Management",
    "Team Collaboration",
    "Critical Thinking",
    "Problem Solving",
  ],

  // ============================================================
  // SERVICES
  // ============================================================
  services: [
    "Full-Stack Web Development",
    "MERN Stack Development",
    "Frontend Development",
    "Backend Development",
    "React.js Development",
    "Node.js Development",
    "Express.js Development",
    "MongoDB Development",
    "REST API Development",
    "JWT Authentication & RBAC",
    "Custom Web Application Development",
    "Business Web Applications",
    "Responsive Website Development",
    "Database Integration",
    "API Integration",
    "Authentication Systems",
    "Admin Dashboards",
    "Enterprise Application Development",
    "Third-Party Service Integration",
    "Payment Gateway Integration",
    "Automation and Workflow Applications",
    "AI Automation Solutions",
    "Deployment & Hosting",
  ],

  // ============================================================
  // PROJECTS
  // ============================================================
  projects: [
    {
      name: "My Drone Force",
      category: "Drone / Full-Stack",
      description:
        "A workforce platform designed to connect youth with drone-career opportunities.",
      link: "https://www.mydroneforce.com/",
      features: [
        "Four-step registration flow (intake, screening, payment, commitment pledge)",
        "Automated eligibility scoring with 13 screening questions",
        "Stripe payment integration",
        "Smart resume registration",
        "Admin dashboard with user management and analytics",
        "PDF and Excel export",
        "Onboarding checklist (4 phases, 27 tasks)",
        "Accountability check-ins",
        "Email automation (welcome, payment confirmations, admin alerts)",
        "Microsoft Clarity + Google Tag Manager integration",
        "Responsive pricing page, FAQs, comparison table",
        "Webinar popup with countdown timer",
        "PDF agreement generation",
      ],
      stack: [
        "React.js",
        "Node.js",
        "Express.js",
        "MongoDB",
        "Stripe",
        "Nodemailer",
        "Cloudinary",
        "Microsoft Clarity",
        "Google Tag Manager",
        "Framer Motion",
        "Railway",
        "Vercel",
      ],
    },
    {
      name: "Drones Directory",
      category: "Client / Drone",
      description:
        "A drone-industry directory / business platform being developed with U.S.-based client Henry Golatt.",
      link: "https://drones-drones-drones.directoryup.com/",
      stack: ["Full-stack web technologies"],
      status: "Active / ongoing",
    },
    {
      name: "OmniForce Vector",
      category: "Client / Integration",
      description:
        "A unified platform initiative associated with DevOps International, integrating three separate tools into one connected platform. Waleed works on this with Henry Golatt.",
      stack: ["Full-stack", "API integration", "System unification"],
      status: "In development",
    },
    {
      name: "Henry Golatt Portfolio",
      category: "Client / Portfolio",
      description:
        "A professional portfolio website developed for Henry Golatt, a U.S.-based Chief Strategist and Economic Development professional.",
      stack: ["Web development"],
    },
    {
      name: "HAMAMA Perfumes",
      category: "Entrepreneurship",
      description:
        "An upcoming perfume / fragrance brand founded by Waleed Badshah. Currently being prepared for launch.",
      link: "https://hamama-perfumes.vercel.app/",
      stack: ["E-commerce web"],
      ownedBy: "Waleed Badshah (Founder)",
    },
    {
      name: "Elegance Perfumes",
      category: "Client / E-commerce",
      description:
        "A perfume-focused web / e-commerce project developed as part of Waleed's portfolio.",
      link: "https://elegance-perfumes.vercel.app/",
      stack: ["Web development"],
    },
    {
      name: "Smart Mall System",
      category: "Enterprise",
      description:
        "A data-driven mall management application built on the Airtool platform at Deister Software for mall administrators and decision-makers.",
      features: [
        "Analytical dashboards",
        "Data cards and charts",
        "Data visualization",
        "Trend management",
        "Automation, triggers, and alerts",
        "Reporting",
        "SQL-based analytical grids",
      ],
      stack: ["Airtool", "SQL"],
    },
    {
      name: "FamilyHub",
      category: "Full-Stack",
      description:
        "A full-stack MERN application built with React.js, Node.js, Express.js and MongoDB, deployed on Vercel.",
      stack: ["React.js", "Node.js", "Express.js", "MongoDB"],
    },
    {
      name: "ShopIT",
      category: "E-commerce / Full-Stack",
      description:
        "A full-stack MERN e-commerce application built with React.js, Node.js, Express.js and MongoDB.",
      stack: ["React.js", "Node.js", "Express.js", "MongoDB"],
    },
    {
      name: "MedLabs",
      category: "Healthcare / Full-Stack",
      description:
        "A full-stack medical laboratory application built with full-stack web technologies.",
      stack: ["Full-stack web technologies"],
    },
    {
      name: "Durshawl Marquee",
      category: "Client / Website",
      description:
        "A responsive React.js website developed for a wedding hall client.",
      stack: ["React.js"],
    },
    {
      name: "Corporate Management System",
      category: "Management System",
      description:
        "A React-based corporate management application developed by Waleed.",
      stack: ["React.js"],
    },
    {
      name: "School Admission Portal",
      category: "Education",
      description:
        "A React-based school admission portal demonstrating Waleed's experience with education-related web applications.",
      stack: ["React.js"],
    },
    {
      name: "Tailors Management System",
      category: "Management System",
      description:
        "A software project designed around management workflows for tailoring businesses.",
      stack: ["Web development"],
    },
  ],

  // ============================================================
  // CERTIFICATIONS
  // ============================================================
  certifications: [
    {
      name: "Full-MERN-Stack Development",
      provider:
        "Ghulam Ishaq Khan Institute (GIKI) / Ministry of Federal Education / NAVTAC",
      issued: "August 2025",
      area: "MERN Stack Development — 3-month training",
    },
    {
      name: "Full Stack Engineer — One Year",
      provider: "NITSEP",
      issued: "14 February 2025",
      area: "Full-Stack Software Development",
    },
    {
      name: "Full Stack Developer Intern",
      provider: "TechSol Labs",
      issued: "1 January 2025",
      area: "Full-Stack Development",
    },
    {
      name: "Meta Front-End Developer Professional Certificate",
      provider: "Meta / Coursera",
      issued: "15 November 2023",
      area: "Frontend Development",
    },
    {
      name: "National Freelancing Training Program — Technical Domain",
      provider: "NFTP / University of Malakand",
      issued: "20 November 2021",
      area: "Freelancing / Technical Domain",
    },
    {
      name: "Talent Certificate",
      provider: "University of Malakand",
      issued: "10 March 2023",
    },
    {
      name: "2nd Annual International Online Workshop on Software Engineering (WSE-22)",
      provider: "University of Malakand",
      issued: "8 June 2022",
    },
  ],

  // ============================================================
  // VENTURES
  // ============================================================
  ventures: [
    {
      name: "HAMAMA Perfumes",
      type: "Upcoming fragrance brand",
      status: "Currently being prepared for launch",
      url: "https://hamama-perfumes.vercel.app/",
      description:
        "HAMAMA Perfumes is an upcoming perfume/fragrance venture founded by Waleed Badshah.",
      ownedBy: "Waleed Badshah",
    },
  ],

  // ============================================================
  // CLIENTS
  // ============================================================
  clients: [
    {
      name: "Henry Golatt",
      country: "United States",
      role: "Chief Strategist and Economic Development professional",
      collaboration: [
        "Drones Directory",
        "Henry Golatt Portfolio",
        "OmniForce Vector (tool integration initiative)",
      ],
      organization: "DevOps International",
    },
  ],

  // ============================================================
  // CONTACT / LINKS
  // ============================================================
  contact: {
    email: "waleedbadshah@gmail.com",
    linkedin: "https://www.linkedin.com/in/waleed-badshah-93b260247/",
    portfolio: "https://waleed-portfolio-theta.vercel.app/",
    github: "",
  },

  projectUrls: {
    portfolio: "https://waleed-portfolio-theta.vercel.app/",
    hamama: "https://hamama-perfumes.vercel.app/",
    dronesDirectory: "https://drones-drones-drones.directoryup.com/",
    elegance: "https://elegance-perfumes.vercel.app/",
    linkedin: "https://www.linkedin.com/in/waleed-badshah-93b260247/",
  },

  // ============================================================
  // SUGGESTIONS
  // ============================================================
  suggestions: [
    "Tell me about Waleed",
    "What's his experience?",
    "What projects has he built?",
    "How can I contact him?",
  ],

  // ============================================================
  // TONE
  // ============================================================
  tone: "Professional, friendly, confident, natural, conversational, and technically knowledgeable.",
};
