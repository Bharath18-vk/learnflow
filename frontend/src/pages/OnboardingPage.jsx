import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    BrainCircuit,
    Laptop,
    BarChart3,
    Cloud,
    Sprout,
    Zap,
    Rocket,
    Clock,
    Calendar,
    Flame,
    PlayCircle,
    FileText,
    Wrench,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Check,
    Briefcase,
    Target,
    BookOpen,
    GraduationCap,
    Sliders,
    Layers,
    AlertCircle,
    ShieldCheck,
    Loader2
} from "lucide-react";
import { generateRoadmap } from "../services/api";
import "./OnboardingPage.css";

const PRESET_GOALS = [
    { id: "ml", title: "Machine Learning", icon: BrainCircuit, desc: "Python, NumPy, Pandas, Scikit-Learn & PyTorch" },
    { id: "webdev", title: "Full-Stack Web Dev", icon: Laptop, desc: "Modern JavaScript, React, FastAPI & Cloud Deploy" },
    { id: "datasci", title: "Data Science & Analytics", icon: BarChart3, desc: "SQL, Exploratory Data Analysis & Statistics" },
    { id: "devops", title: "DevOps & Cloud", icon: Cloud, desc: "Docker, CI/CD Pipelines, Kubernetes & AWS" },
];

const TARGET_OUTCOMES = [
    { id: "Job-ready", title: "Job-Ready Competency", icon: Briefcase, desc: "Production standards, portfolio projects & industry tooling" },
    { id: "Build a project", title: "Build a Specific Project", icon: Wrench, desc: "Direct, practical path to ship a functional product" },
    { id: "Interview prep", title: "Technical Interview Prep", icon: Target, desc: "Algorithms, architecture patterns & problem solving" },
    { id: "Conceptual overview", title: "Fast Conceptual Overview", icon: BookOpen, desc: "Mental models, high-level theory & terminology" },
];

const SKILL_LEVELS = [
    { id: "Beginner", title: "Beginner", icon: Sprout, desc: "Starting from scratch, establish baseline principles" },
    { id: "Intermediate", title: "Intermediate", icon: Zap, desc: "Familiar with syntax, ready for applied architecture" },
    { id: "Advanced", title: "Advanced", icon: Rocket, desc: "Solid experience, seeking deep optimization and mastery" },
];

const TIME_OPTIONS = [
    { id: 15, label: "15m", title: "15 Mins / Day", icon: Clock, desc: "Micro-learning habit" },
    { id: 30, label: "30m", title: "30 Mins / Day", icon: Calendar, desc: "Steady daily progress" },
    { id: 60, label: "1h", title: "1 Hour / Day", icon: Flame, desc: "Accelerated pace" },
    { id: 120, label: "2h+", title: "2+ Hours / Day", icon: Zap, desc: "Full immersion" },
];

const DAYS_OPTIONS = [3, 4, 5, 6, 7];

const DEPTH_OPTIONS = [
    {
        id: "Quick Practical",
        title: "Quick Practical",
        badge: "⚡ Fast Track",
        desc: "3-4 essential milestones focused on shipping immediately. Skips secondary theory."
    },
    {
        id: "Balanced",
        title: "Balanced",
        badge: "⭐ Recommended",
        desc: "4-6 milestones covering core foundations, applied tooling, and a portfolio capstone."
    },
    {
        id: "Deep Fundamental",
        title: "Deep Fundamental",
        badge: "🔬 Deep Dive",
        desc: "6-8 milestones exploring internal engine mechanics, performance edge cases, and architectural scalability."
    },
];

const MODALITY_OPTIONS = [
    { id: "Video tutorials", title: "Video Walkthroughs", icon: PlayCircle, desc: "Visual step-by-step demonstrations" },
    { id: "Articles & Documentation", title: "Official Documentation", icon: FileText, desc: "API references and deep-dive reading" },
    { id: "Hands-on projects", title: "Hands-on Projects & Repos", icon: Wrench, desc: "Real GitHub starter code and build drills" },
    { id: "Quizzes & Knowledge Checks", title: "Interactive Quizzes", icon: GraduationCap, desc: "Active recall testing after each milestone" },
];

export function OnboardingPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Form state
    const [goalTitle, setGoalTitle] = useState("Machine Learning");
    const [customGoal, setCustomGoal] = useState("");
    const [targetOutcome, setTargetOutcome] = useState("Job-ready");
    const [skillLevel, setSkillLevel] = useState("Beginner");
    const [existingKnowledge, setExistingKnowledge] = useState("");
    const [dailyMinutes, setDailyMinutes] = useState(30);
    const [daysPerWeek, setDaysPerWeek] = useState(5);
    const [deadline, setDeadline] = useState("");
    const [desiredDepth, setDesiredDepth] = useState("Balanced");
    const [selectedModalities, setSelectedModalities] = useState([
        "Hands-on projects",
        "Video tutorials",
        "Articles & Documentation"
    ]);

    const [loading, setLoading] = useState(false);
    const [synthesisStage, setSynthesisStage] = useState(0);
    const [error, setError] = useState("");

    const selectedGoal = customGoal.trim() ? customGoal : goalTitle;

    // Derived Capacity Calculations
    const weeklyHours = useMemo(() => {
        return ((dailyMinutes * daysPerWeek) / 60).toFixed(1);
    }, [dailyMinutes, daysPerWeek]);

    const daysUntilDeadline = useMemo(() => {
        if (!deadline) return null;
        const now = new Date();
        const target = new Date(deadline);
        const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    }, [deadline]);

    const totalAvailableHours = useMemo(() => {
        if (!daysUntilDeadline) return null;
        const weeks = daysUntilDeadline / 7.0;
        return (weeks * parseFloat(weeklyHours)).toFixed(1);
    }, [daysUntilDeadline, weeklyHours]);

    // Fast-Add Tag Pills for Step 2
    const commonTags = ["Python", "JavaScript", "React", "HTML/CSS", "SQL", "Git", "Docker", "None (Complete Beginner)"];

    const handleAddTag = (tag) => {
        if (tag.startsWith("None")) {
            setExistingKnowledge("");
            return;
        }
        if (!existingKnowledge) {
            setExistingKnowledge(tag);
        } else if (!existingKnowledge.toLowerCase().includes(tag.toLowerCase())) {
            setExistingKnowledge(prev => `${prev}, ${tag}`);
        }
    };

    const handleToggleModality = (id) => {
        setSelectedModalities(prev =>
            prev.includes(id) ? (prev.length > 1 ? prev.filter(m => m !== id) : prev) : [...prev, id]
        );
    };

    const setQuickDeadline = (months) => {
        if (months === 0) {
            setDeadline("");
            return;
        }
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        setDeadline(d.toISOString().split("T")[0]);
    };

    // Helper to generate concept-specific blueprint preview driven strictly by user inputs
    const emergingSteps = useMemo(() => {
        const goal = (selectedGoal || "Learning Path").trim();
        const gLower = goal.toLowerCase();
        const priorStr = (existingKnowledge || "").trim().toLowerCase();
        const hasPrior = priorStr.length > 0 && !priorStr.includes("none");
        const outcomeLower = targetOutcome.toLowerCase();

        // 1. Determine outcome capstone
        let capstoneTitle = `Production-Grade ${goal} Industry Capstone`;
        let capstoneDesc = `Build, benchmark, test, containerize, and deploy an end-to-end milestone meeting '${targetOutcome}' standards.`;
        if (outcomeLower.includes("interview")) {
            capstoneTitle = `${goal} Technical Interview & System Design Simulation`;
            capstoneDesc = `High-intensity problem-solving drills, edge-case analysis, architectural trade-offs, and mock technical evaluation.`;
        } else if (outcomeLower.includes("build a project")) {
            capstoneTitle = `Full-Featured ${goal} Application Project`;
            capstoneDesc = `Synthesize all concepts into a complete working project with robust error handling, state management, and live deployment.`;
        } else if (outcomeLower.includes("conceptual")) {
            capstoneTitle = `${goal} Architectural Blueprint & Comparative Analysis`;
            capstoneDesc = `Comprehensive technical evaluation of architectural trade-offs, scalability limits, and design patterns.`;
        }

        // 2. Build domain-specific candidate milestones
        let candidates = [];

        if (gLower.includes("deep learning") || gLower.includes("nlp") || gLower.includes("llm") || gLower.includes("prompt engineering")) {
            candidates = [
                {
                    title: "PyTorch Tensors, Autograd & Dynamic Computation Graphs",
                    desc: "Multidimensional tensor math, GPU CUDA acceleration, automated gradient descent, and loss optimization.",
                    tag: "python"
                },
                {
                    title: "Neural Architectures: Multi-Layer Perceptrons & Backpropagation",
                    desc: "Feedforward networks, activation functions (ReLU, GELU), regularization (Dropout), and weight initialization.",
                    tag: "neural"
                },
                {
                    title: "Attention Mechanisms & Transformer Architecture Deep Dive",
                    desc: "Scaled dot-product attention, multi-head self-attention, positional encodings, and encoder-decoder blocks.",
                    tag: "transformers"
                },
                {
                    title: "LLM Fine-Tuning, LoRA & Vector RAG Architectures",
                    desc: "Parameter-efficient fine-tuning (LoRA, QLoRA), tokenization, vector databases (Chroma/Pinecone), and LangChain.",
                    tag: "rag"
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("machine learning") || gLower.includes("artificial intelligence") || gLower === "ml") {
            candidates = [
                {
                    title: "Python & Linear Algebra Foundations for Machine Learning",
                    desc: "Matrix operations, vector projections, eigenvalue intuition, and probability distributions for ML.",
                    tag: "python"
                },
                {
                    title: "NumPy, Pandas & Exploratory Data Analysis (EDA)",
                    desc: "High-performance data manipulation, missing value imputation, outlier detection, and correlation visualization.",
                    tag: "pandas"
                },
                {
                    title: "Classical Supervised & Unsupervised Machine Learning Models",
                    desc: "Linear/logistic regression, decision trees, random forests, gradient boosting (XGBoost), SVMs, and k-means.",
                    tag: "scikit"
                },
                {
                    title: "Model Validation, Hyperparameter Tuning & Cross-Validation",
                    desc: "Prevent data leakage, Stratified K-Fold, Optuna hyperparameter sweeps, and ROC-AUC / F1 evaluation.",
                    tag: "validation"
                },
                {
                    title: "Neural Networks & PyTorch Fundamentals",
                    desc: "Multilayer perceptrons, backpropagation loss gradients, and convolutional layers using PyTorch.",
                    tag: "pytorch",
                    deepOnly: true
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("data science") || gLower.includes("analytics") || gLower.includes("bi")) {
            candidates = [
                {
                    title: "Relational Data Modeling & Advanced SQL Analytics",
                    desc: "Multi-table joins, subqueries, Common Table Expressions (CTEs), window functions, and aggregation rollups.",
                    tag: "sql"
                },
                {
                    title: "Exploratory Data Analysis with Pandas & Visualization (Seaborn/Plotly)",
                    desc: "Data cleaning, feature engineering, statistical distributions, and interactive dashboards.",
                    tag: "pandas"
                },
                {
                    title: "Statistical Inference, Probability & A/B Experimentation",
                    desc: "Hypothesis testing, two-sample t-tests, p-values, confidence intervals, and statistical power calculations.",
                    tag: "statistics"
                },
                {
                    title: "Predictive Feature Engineering & Baseline Machine Learning",
                    desc: "Predictive modeling with Scikit-Learn to uncover business drivers, churn probabilities, and forecast metrics.",
                    tag: "ml"
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("react") || gLower.includes("frontend") || gLower.includes("next")) {
            candidates = [
                {
                    title: "Modern JavaScript (ES6+), DOM Manipulation & Async Engine",
                    desc: "Arrow functions, destructuring, modules, closures, Promises, async/await, and browser event loop mechanics.",
                    tag: "javascript"
                },
                {
                    title: "React Component Architecture, JSX & Reactive Rendering",
                    desc: "Modular functional components, unidirectional data flow, props interfaces, and lifecycle rendering.",
                    tag: "react"
                },
                {
                    title: "State Management Mastery: Hooks, Context & Reducers",
                    desc: "Deep dive into useState, useEffect, useRef, useMemo, useCallback, custom hooks, and scalable Context machines.",
                    tag: "hooks"
                },
                {
                    title: "Server State, Client Routing & Form Architecture",
                    desc: "TanStack Query cache invalidation, React Router 6 dynamic nested routes, and React Hook Form with Zod validation.",
                    tag: "router"
                },
                {
                    title: "Performance Profiling, Virtualization & Accessibility (a11y)",
                    desc: "React DevTools re-render profiling, list virtualization, code-splitting with React.lazy, and WCAG standards.",
                    tag: "performance",
                    deepOnly: true
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("fastapi") || gLower.includes("backend") || gLower.includes("api") || gLower.includes("node")) {
            candidates = [
                {
                    title: "RESTful Architecture, HTTP Invariants & API Contract Design",
                    desc: "Deterministic REST endpoints, HTTP verbs, status codes, headers, and OpenAPI/Swagger documentation.",
                    tag: "http"
                },
                {
                    title: "Request Validation, Pydantic Schema Modeling & Serialization",
                    desc: "Robust request payloads, nested relational schemas, type constraints, and strict JSON response formatting.",
                    tag: "pydantic"
                },
                {
                    title: "Dependency Injection & Async Database Session Architecture",
                    desc: "Modular dependency injection pipelines, async connection pools, and database migration workflows.",
                    tag: "database"
                },
                {
                    title: "Security Architecture: OAuth2, JWT Auth & Rate Limiting",
                    desc: "Cryptographic password hashing, token issuance, middleware authentication guards, CORS, and Redis rate limiting.",
                    tag: "security"
                },
                {
                    title: "Background Tasks, Caching & Resilient Error Boundaries",
                    desc: "Asynchronous background workers (Celery/BullMQ), Redis response caching, structured logging, and health probes.",
                    tag: "caching",
                    deepOnly: true
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("docker") || gLower.includes("container")) {
            candidates = [
                {
                    title: "Linux Namespaces, Cgroups & Container Runtime Mechanics",
                    desc: "Process isolation, chroot, cgroups, namespaces, and the Docker client-daemon architecture.",
                    tag: "linux"
                },
                {
                    title: "Dockerfile Optimization & Multi-Stage Production Builds",
                    desc: "Layer caching, multi-stage compilation, minimal base images (Alpine/Distroless), and non-root users.",
                    tag: "dockerfile"
                },
                {
                    title: "Multi-Service Orchestration with Docker Compose & Custom Networks",
                    desc: "Multi-tier applications (Frontend, API, Postgres, Redis), bridge networks, volume mounts, and secrets.",
                    tag: "compose"
                },
                {
                    title: "Container Security Auditing, Trivy Scanning & CI Registry Push",
                    desc: "Scan containers for CVE vulnerabilities with Trivy, sign images, and automate builds via GitHub Actions.",
                    tag: "security"
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("kubernetes") || gLower.includes("k8s") || gLower.includes("helm")) {
            candidates = [
                {
                    title: "Kubernetes Control Plane Architecture & Core Primitives",
                    desc: "etcd, kube-apiserver, kube-scheduler, kube-controller-manager, and fundamental Pod / ReplicaSet lifecycles.",
                    tag: "k8s"
                },
                {
                    title: "Deployments, Zero-Downtime Rollouts & Service Networking",
                    desc: "RollingUpdate strategies, ClusterIP, NodePort, LoadBalancer services, and CoreDNS internal resolution.",
                    tag: "networking"
                },
                {
                    title: "ConfigMaps, Secrets, Ingress Controllers & TLS Termination",
                    desc: "Externalized configuration, base64 secrets, NGINX Ingress, and automated TLS cert-manager issuing.",
                    tag: "ingress"
                },
                {
                    title: "Persistent Storage, Helm 3 Packaging & Declarative GitOps",
                    desc: "PersistentVolumes, PVCs, reusable Helm 3 charts, and synchronized cluster state with ArgoCD GitOps.",
                    tag: "helm"
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("devops") || gLower.includes("cloud") || gLower.includes("aws") || gLower.includes("ci/cd") || gLower.includes("terraform")) {
            candidates = [
                {
                    title: "Linux Systems Administration, Shell Automation & Networking",
                    desc: "Bash scripting, systemd services, user permissions, SSH keys, cron jobs, and DNS/firewall network configuration.",
                    tag: "linux"
                },
                {
                    title: "Continuous Integration & Automated Testing with GitHub Actions",
                    desc: "Automated CI workflows for linting, unit testing, matrix builds, artifact caching, and environment secret management.",
                    tag: "ci"
                },
                {
                    title: "Infrastructure as Code (IaC) with Terraform & Cloud Modules",
                    desc: "Provision reproducible cloud infrastructure (VPCs, EC2, S3, RDS), state locking, and declarative HCL modules.",
                    tag: "terraform"
                },
                {
                    title: "Production Observability: Prometheus Metrics & Grafana Alerting",
                    desc: "Instrument application metrics, configure Prometheus scraping, build operational Grafana dashboards, and alert routing.",
                    tag: "observability"
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("sql") || gLower.includes("database") || gLower.includes("postgres")) {
            candidates = [
                {
                    title: "Relational Data Modeling & 3NF Normalization Principles",
                    desc: "Design normalized schemas, enforce primary/foreign keys, uniqueness constraints, and data integrity.",
                    tag: "modeling"
                },
                {
                    title: "Advanced SQL: CTEs, Window Functions & Aggregations",
                    desc: "PARTITION BY, RANK, DENSE_RANK, LAG, LEAD, recursive CTEs, and complex analytics over millions of rows.",
                    tag: "sql"
                },
                {
                    title: "Query Execution Plans (EXPLAIN ANALYZE) & Indexing Strategies",
                    desc: "Inspect query costs, sequential vs index scans, B-Tree, GIN, Hash indexes, and eliminate slow table scans.",
                    tag: "indexing"
                },
                {
                    title: "Transactions, ACID Guarantees, MVCC & Concurrency Locking",
                    desc: "Multi-Version Concurrency Control, transaction isolation levels (Read Committed to Serializable), and row locking.",
                    tag: "transactions"
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("cybersecurity") || gLower.includes("security") || gLower.includes("hacking")) {
            candidates = [
                {
                    title: "Network Protocols, Traffic Interception & Wireshark Analysis",
                    desc: "TCP/IP handshakes, DNS, ARP poisoning, TLS certificates, packet dissection, and network reconnaissance.",
                    tag: "networking"
                },
                {
                    title: "Web Application Security & OWASP Top 10 Vulnerabilities",
                    desc: "SQL Injection, Cross-Site Scripting (XSS), CSRF, Server-Side Request Forgery (SSRF), and broken access controls.",
                    tag: "owasp"
                },
                {
                    title: "Reconnaissance, Port Scanning (Nmap) & Attack Surface Mapping",
                    desc: "Passive OSINT, active port scanning with Nmap, banner grabbing, service enumeration, and vulnerability assessment.",
                    tag: "recon"
                },
                {
                    title: "Privilege Escalation, Exploit Mechanics & Post-Exploitation",
                    desc: "Linux SUID misconfigurations, Windows Token manipulation, Metasploit payload delivery, and credential harvesting.",
                    tag: "exploit"
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("mobile") || gLower.includes("flutter") || gLower.includes("react native") || gLower.includes("android") || gLower.includes("ios")) {
            candidates = [
                {
                    title: "Core Language & Reactive Paradigm Architecture",
                    desc: "Reactive programming conventions, asynchronous streams, object lifecycle, and declarative component paradigms.",
                    tag: "language"
                },
                {
                    title: "Declarative Widget Layouts, Navigation & Responsive Theming",
                    desc: "Adaptive mobile layouts, nested navigation stacks, Material 3 / Cupertino styling, and responsive orientation.",
                    tag: "layout"
                },
                {
                    title: "Predictable State Management & Asynchronous API Integration",
                    desc: "Unidirectional state management (Riverpod/Bloc/Redux), optimistic UI updates, and RESTful API networking.",
                    tag: "state"
                },
                {
                    title: "Offline Local Persistence, Device APIs & Push Notifications",
                    desc: "Store structured offline data with SQLite/Hive, access camera and geolocation permissions, and push alerts.",
                    tag: "storage"
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("algorithm") || gLower.includes("dsa") || gLower.includes("leetcode")) {
            candidates = [
                {
                    title: "Asymptotic Analysis (Big-O), Arrays & Two-Pointer Patterns",
                    desc: "Time and space complexity, in-place array manipulation, sliding window techniques, and prefix sums.",
                    tag: "arrays"
                },
                {
                    title: "Linked Lists, Monotonic Stacks, Queues & Hash Maps",
                    desc: "Pointers, fast/slow runner cycle detection, monotonic stacks for nearest elements, and hash collision resolution.",
                    tag: "stacks"
                },
                {
                    title: "Trees, Binary Search, Heaps & Graph Traversals (BFS/DFS)",
                    desc: "Tree recursions, lowest common ancestor, heap priority queues, connected components, and topological sorting.",
                    tag: "graphs"
                },
                {
                    title: "Dynamic Programming: Memoization, Tabulation & Knapsack Patterns",
                    desc: "Optimal substructure and overlapping subproblems, memoization to tabulation conversion, and knapsack variations.",
                    tag: "dp"
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else if (gLower.includes("web dev") || gLower.includes("full stack") || gLower.includes("fullstack")) {
            candidates = [
                {
                    title: "Semantic HTML5, Responsive Modern CSS & Web Layouts",
                    desc: "Accessible semantic elements, CSS Grid, Flexbox, custom properties, and fluid typography.",
                    tag: "html"
                },
                {
                    title: "Modern JavaScript (ES6+), Asynchronous Patterns & Fetch API",
                    desc: "Closures, array transformations, Promises, async/await, DOM event delegation, and JSON networking.",
                    tag: "javascript"
                },
                {
                    title: "React Component Architecture & Client State Management",
                    desc: "Reusable UI components, declarative component state with hooks, and client-side routing.",
                    tag: "react"
                },
                {
                    title: "RESTful Backend Services, JWT Authentication & Databases",
                    desc: "High-throughput REST APIs, cryptographic authentication, database schema relationships, and ORM operations.",
                    tag: "backend"
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        } else {
            // Concept Decomposer for ANY custom topic
            candidates = [
                {
                    title: `${goal} Core Mechanics & Execution Environment`,
                    desc: `Master the fundamental syntax, execution environment, primary terminology, and baseline mental models of ${goal}.`,
                    tag: "basics"
                },
                {
                    title: `State Representation, Data Flow & Essential Primitives in ${goal}`,
                    desc: `How data and state are structured, transformed, validated, and managed when building practical systems with ${goal}.`,
                    tag: "state"
                },
                {
                    title: `Applied Architecture & Modular Pattern Design for ${goal}`,
                    desc: `Implement real-world architectural workflows, modular component abstractions, error boundaries, and integration patterns using ${goal}.`,
                    tag: "architecture"
                },
                {
                    title: `Performance Optimization, Resiliency & Production Hardening in ${goal}`,
                    desc: `Profile resource utilization, eliminate bottlenecks, handle failure modes, enforce security invariants, and apply production standards in ${goal}.`,
                    tag: "optimization"
                },
                {
                    title: capstoneTitle,
                    desc: capstoneDesc,
                    isCapstone: true
                }
            ];
        }

        // 3. Filter out steps the user already knows
        let filtered = candidates;
        if (hasPrior) {
            filtered = candidates.filter(c => {
                if (c.isCapstone) return true;
                const cTitle = c.title.toLowerCase();
                const tag = (c.tag || "").toLowerCase();
                // If user prior knowledge mentions this tag or title keyword, bypass it!
                const overlaps = priorStr.includes(tag) || (tag.length > 2 && priorStr.split(/[\s,]+/).some(w => w.length > 2 && (cTitle.includes(w) || tag.includes(w))));
                // Only skip beginner/foundational items, keep advanced
                return !(overlaps && (cTitle.includes("foundations") || cTitle.includes("basics") || cTitle.includes("html") || cTitle.includes("python")));
            });
            if (filtered.length < 3) filtered = candidates;
        }

        // 4. Adjust milestone count based on desiredDepth
        let activeList = filtered;
        if (desiredDepth === "Quick Practical") {
            // Keep top 3-4 steps (ensure capstone is kept)
            const cap = activeList.find(c => c.isCapstone);
            const others = activeList.filter(c => !c.isCapstone && !c.deepOnly);
            activeList = [...others.slice(0, 3), cap || others[others.length - 1]].filter(Boolean);
        } else if (desiredDepth === "Balanced") {
            const cap = activeList.find(c => c.isCapstone);
            const others = activeList.filter(c => !c.isCapstone);
            activeList = [...others.slice(0, 4), cap || others[others.length - 1]].filter(Boolean);
        }

        // 5. Format output with hours
        return activeList.map((s, idx) => {
            let hours = "6 hrs";
            if (desiredDepth === "Deep Fundamental") {
                hours = s.isCapstone ? "14 hrs" : (idx === 0 ? "8 hrs" : "12 hrs");
            } else if (desiredDepth === "Quick Practical") {
                hours = s.isCapstone ? "7 hrs" : "5 hrs";
            } else {
                hours = s.isCapstone ? "8 hrs" : (idx === 0 ? "5 hrs" : "7 hrs");
            }

            return {
                num: idx + 1,
                title: s.title,
                desc: s.desc,
                hours: hours
            };
        });
    }, [selectedGoal, skillLevel, existingKnowledge, desiredDepth, targetOutcome]);

    const handleNext = () => {
        if (step < 4) {
            setStep(prev => prev + 1);
        } else {
            handleCompleteOnboarding();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
        }
    };

    const handleCompleteOnboarding = async () => {
        setLoading(true);
        setError("");
        setSynthesisStage(1);

        const stageInterval = setInterval(() => {
            setSynthesisStage(prev => (prev < 4 ? prev + 1 : prev));
        }, 1200);

        try {
            await generateRoadmap({
                goal_title: selectedGoal,
                target_outcome: targetOutcome,
                skill_level: skillLevel,
                existing_knowledge: existingKnowledge,
                daily_minutes: dailyMinutes,
                days_per_week: daysPerWeek,
                deadline: deadline || null,
                desired_depth: desiredDepth,
                preferred_format: selectedModalities.join(", "),
                learning_preferences: selectedModalities
            });
            clearInterval(stageInterval);
            navigate("/dashboard");
        } catch (err) {
            clearInterval(stageInterval);
            console.error("Failed to generate roadmap:", err);
            const message = typeof err === "string" ? err : (err?.message || "Failed to generate roadmap. Please try again.");
            setError(typeof message === "string" ? message : JSON.stringify(message));
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-page-layout">
            <div className="onboarding-split-container">
                {/* Left: Progressive Question Studio */}
                <div className="onboarding-form-column">
                    <div className="onboarding-brand-header">
                        <span className="telemetry-label font-mono">STEP 0{step} OF 04 • PERSONALIZED ROADMAP ENGINE</span>
                        <h1 className="onboarding-main-title font-display">
                            {step === 1 && "What is your learning goal & target outcome?"}
                            {step === 2 && "What is your current background & experience?"}
                            {step === 3 && "What is your study capacity & target deadline?"}
                            {step === 4 && "How deep and in what format do you want to learn?"}
                        </h1>
                        <p className="onboarding-subtitle font-sans">
                            {step === 1 && "Every curriculum is dynamically built around your exact end objective."}
                            {step === 2 && `We skip what you already know so you don't waste time on redundant basics.`}
                            {step === 3 && "Calculates realistic hour capacity and schedules achievable milestones."}
                            {step === 4 && "Tailors milestone depth and curates resources matching your cognitive style."}
                        </p>
                    </div>

                    {/* Progress Bar Indicator */}
                    <div className="onboarding-stepper">
                        {[1, 2, 3, 4].map(s => (
                            <div
                                key={s}
                                className={`stepper-segment ${s === step ? "active" : s < step ? "completed" : ""}`}
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="onboarding-error-banner font-sans">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {loading ? (
                        /* Dynamic AI Synthesis Screen */
                        <div className="synthesis-loading-box">
                            <div className="synthesis-spinner-wrapper">
                                <Loader2 size={36} className="synthesis-spinner" />
                            </div>
                            <h3 className="font-display">Synthesizing Constraint-Aware Roadmap...</h3>
                            <div className="synthesis-checklist font-mono">
                                <div className={`synthesis-step ${synthesisStage >= 1 ? "done" : "active"}`}>
                                    <Check size={14} /> <span>Goal & Target: {selectedGoal} ({targetOutcome})</span>
                                </div>
                                <div className={`synthesis-step ${synthesisStage >= 2 ? "done" : synthesisStage === 1 ? "active" : "pending"}`}>
                                    <Check size={14} /> <span>Auditing prior knowledge & skipping baseline duplicates</span>
                                </div>
                                <div className={`synthesis-step ${synthesisStage >= 3 ? "done" : synthesisStage === 2 ? "active" : "pending"}`}>
                                    <Check size={14} /> <span>Validating study capacity ({weeklyHours} hrs/wk budget)</span>
                                </div>
                                <div className={`synthesis-step ${synthesisStage >= 4 ? "done" : synthesisStage === 3 ? "active" : "pending"}`}>
                                    <Check size={14} /> <span>Structuring phases, prerequisites & curating top resources</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {/* STEP 1: GOAL & TARGET OUTCOME */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.22 }}
                                    className="step-options-container"
                                >
                                    <div className="field-group">
                                        <label className="section-field-label font-display">1. Choose or enter your learning goal</label>
                                        <div className="options-grid">
                                            {PRESET_GOALS.map(g => {
                                                const IconComp = g.icon;
                                                const isSelected = goalTitle === g.title && !customGoal;
                                                return (
                                                    <div
                                                        key={g.id}
                                                        className={`choice-card ${isSelected ? "selected" : ""}`}
                                                        onClick={() => {
                                                            setGoalTitle(g.title);
                                                            setCustomGoal("");
                                                        }}
                                                    >
                                                        <div className="choice-icon-box">
                                                            <IconComp size={20} />
                                                        </div>
                                                        <div className="choice-text">
                                                            <span className="choice-label font-display">{g.title}</span>
                                                            <span className="choice-desc font-sans">{g.desc}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="custom-goal-input-box">
                                            <input
                                                type="text"
                                                className="custom-input font-interactive"
                                                placeholder="Or enter custom topic (e.g. Distributed Systems, Rust, PyTorch, React 19...)"
                                                value={customGoal}
                                                onChange={e => setCustomGoal(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="section-field-label font-display">2. Select your target outcome</label>
                                        <div className="options-grid outcome-grid">
                                            {TARGET_OUTCOMES.map(o => {
                                                const IconComp = o.icon;
                                                const isSelected = targetOutcome === o.id;
                                                return (
                                                    <div
                                                        key={o.id}
                                                        className={`choice-card ${isSelected ? "selected" : ""}`}
                                                        onClick={() => setTargetOutcome(o.id)}
                                                    >
                                                        <div className="choice-icon-box">
                                                            <IconComp size={18} />
                                                        </div>
                                                        <div className="choice-text">
                                                            <span className="choice-label font-display">{o.title}</span>
                                                            <span className="choice-desc font-sans">{o.desc}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: SKILL LEVEL & PRIOR KNOWLEDGE */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.22 }}
                                    className="step-options-container"
                                >
                                    <div className="field-group">
                                        <label className="section-field-label font-display">1. Overall skill level</label>
                                        <div className="options-grid vertical-stack">
                                            {SKILL_LEVELS.map(lvl => {
                                                const IconComp = lvl.icon;
                                                const isSelected = skillLevel === lvl.id;
                                                return (
                                                    <div
                                                        key={lvl.id}
                                                        className={`choice-card horizontal ${isSelected ? "selected" : ""}`}
                                                        onClick={() => setSkillLevel(lvl.id)}
                                                    >
                                                        <div className="choice-icon-box">
                                                            <IconComp size={20} />
                                                        </div>
                                                        <div className="choice-text">
                                                            <span className="choice-label font-display">{lvl.title}</span>
                                                            <span className="choice-desc font-sans">{lvl.desc}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="section-field-label font-display">2. What topics or tools do you already know? (Optional)</label>
                                        <p className="field-sub-label font-sans">
                                            Anything you specify here will be fast-forwarded or omitted from introductory phases.
                                        </p>
                                        <input
                                            type="text"
                                            className="custom-input font-interactive"
                                            placeholder="e.g. Python loops, basic SQL queries, Git branching, HTML tags..."
                                            value={existingKnowledge}
                                            onChange={e => setExistingKnowledge(e.target.value)}
                                        />
                                        <div className="tag-pills-row font-mono">
                                            <span className="tag-pills-label">Quick add:</span>
                                            {commonTags.map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    className="tag-pill-btn"
                                                    onClick={() => handleAddTag(tag)}
                                                >
                                                    + {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: STUDY CAPACITY & DEADLINE */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.22 }}
                                    className="step-options-container"
                                >
                                    <div className="field-group">
                                        <label className="section-field-label font-display">1. Daily study time</label>
                                        <div className="options-grid">
                                            {TIME_OPTIONS.map(t => {
                                                const IconComp = t.icon;
                                                const isSelected = dailyMinutes === t.id;
                                                return (
                                                    <div
                                                        key={t.id}
                                                        className={`choice-card ${isSelected ? "selected" : ""}`}
                                                        onClick={() => setDailyMinutes(t.id)}
                                                    >
                                                        <div className="choice-icon-box">
                                                            <IconComp size={20} />
                                                        </div>
                                                        <div className="choice-text">
                                                            <span className="choice-label font-display">{t.title}</span>
                                                            <span className="choice-desc font-sans">{t.desc}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="section-field-label font-display">2. Days available per week</label>
                                        <div className="days-picker-row font-display">
                                            {DAYS_OPTIONS.map(d => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    className={`days-pill-btn ${daysPerWeek === d ? "selected" : ""}`}
                                                    onClick={() => setDaysPerWeek(d)}
                                                >
                                                    {d} Days / Wk
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <div className="deadline-header-row">
                                            <label className="section-field-label font-display">3. Target deadline (Optional)</label>
                                            <div className="quick-deadlines font-mono">
                                                <button type="button" className={`quick-deadline-btn ${!deadline ? "active" : ""}`} onClick={() => setQuickDeadline(0)}>Self-paced</button>
                                                <button type="button" className="quick-deadline-btn" onClick={() => setQuickDeadline(1)}>1 Mo</button>
                                                <button type="button" className="quick-deadline-btn" onClick={() => setQuickDeadline(3)}>3 Mos</button>
                                                <button type="button" className="quick-deadline-btn" onClick={() => setQuickDeadline(6)}>6 Mos</button>
                                            </div>
                                        </div>
                                        <input
                                            type="date"
                                            className="custom-input date-input font-interactive"
                                            value={deadline}
                                            onChange={e => setDeadline(e.target.value)}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 4: DEPTH & MODALITIES */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.22 }}
                                    className="step-options-container"
                                >
                                    <div className="field-group">
                                        <label className="section-field-label font-display">1. Desired curriculum depth</label>
                                        <div className="options-grid vertical-stack">
                                            {DEPTH_OPTIONS.map(d => {
                                                const isSelected = desiredDepth === d.id;
                                                return (
                                                    <div
                                                        key={d.id}
                                                        className={`choice-card horizontal ${isSelected ? "selected" : ""}`}
                                                        onClick={() => setDesiredDepth(d.id)}
                                                    >
                                                        <div className="choice-text">
                                                            <div className="depth-title-row">
                                                                <span className="choice-label font-display">{d.title}</span>
                                                                <span className="depth-badge font-mono">{d.badge}</span>
                                                            </div>
                                                            <span className="choice-desc font-sans">{d.desc}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="section-field-label font-display">2. Preferred study modalities (Multi-select)</label>
                                        <div className="options-grid">
                                            {MODALITY_OPTIONS.map(m => {
                                                const IconComp = m.icon;
                                                const isSelected = selectedModalities.includes(m.id);
                                                return (
                                                    <div
                                                        key={m.id}
                                                        className={`choice-card ${isSelected ? "selected" : ""}`}
                                                        onClick={() => handleToggleModality(m.id)}
                                                    >
                                                        <div className="choice-icon-box">
                                                            <IconComp size={18} />
                                                        </div>
                                                        <div className="choice-text">
                                                            <span className="choice-label font-display">{m.title}</span>
                                                            <span className="choice-desc font-sans">{m.desc}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Wizard Navigation Actions */}
                            <div className="onboarding-actions-row">
                                {step > 1 ? (
                                    <button className="onboarding-back-btn font-interactive" onClick={handleBack}>
                                        <ArrowLeft size={16} />
                                        <span>Back</span>
                                    </button>
                                ) : <div />}

                                <button
                                    className="onboarding-next-btn font-interactive"
                                    onClick={handleNext}
                                    disabled={!selectedGoal}
                                >
                                    <span>{step === 4 ? "Generate Personalized Roadmap" : "Continue"}</span>
                                    {step === 4 ? <Sparkles size={16} /> : <ArrowRight size={16} />}
                                </button>
                            </div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Right: Emerging Real-Time Synthesis Preview */}
                <div className="onboarding-preview-column">
                    <div className="synthesis-canvas-card">
                        <div className="synthesis-card-header">
                            <span className="telemetry-label font-mono">LIVE CAPACITY & CURRICULUM PREVIEW</span>
                            <h3 className="font-display">Emerging Roadmap Blueprint</h3>
                        </div>

                        {/* Capacity Telemetry Pill HUD */}
                        <div className="capacity-telemetry-hud">
                            <div className="capacity-stat-box">
                                <span className="stat-label font-mono">WEEKLY COMMITMENT</span>
                                <span className="stat-val font-display">{weeklyHours} <span className="stat-unit">hrs/wk</span></span>
                            </div>
                            <div className="capacity-stat-box">
                                <span className="stat-label font-mono">CAPACITY BUDGET</span>
                                <span className="stat-val font-display">{totalAvailableHours ? `${totalAvailableHours} hrs` : "Self-Paced"}</span>
                            </div>
                        </div>

                        <div className="synthesis-summary-pills font-mono">
                            <span className="summary-pill goal">{selectedGoal}</span>
                            <span className="summary-pill outcome">{targetOutcome}</span>
                            <span className="summary-pill depth">{desiredDepth}</span>
                        </div>

                        {existingKnowledge.trim() && !existingKnowledge.toLowerCase().includes("none") && (
                            <div className="prior-knowledge-notice font-sans">
                                <ShieldCheck size={14} className="icon-emerald" />
                                <span>Accelerated for existing knowledge: <strong>{existingKnowledge}</strong></span>
                            </div>
                        )}

                        {/* Emerging Conduit Track */}
                        <div className="emerging-conduit-list">
                            {emergingSteps.map((s, idx) => (
                                <motion.div
                                    key={s.title}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.06 }}
                                    className="emerging-conduit-item"
                                >
                                    <div className="emerging-node font-mono">{s.num}</div>
                                    <div className="emerging-text">
                                        <span className="emerging-title font-display">{s.title}</span>
                                        <span className="emerging-sub font-sans">{s.desc}</span>
                                    </div>
                                    <span className="emerging-hours-tag font-mono">~{s.hours}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="synthesis-canvas-footer font-sans">
                            <Sparkles size={14} className="sparkle-cyan" />
                            <span>Roadmap adjusts milestones and hours dynamically based on all constraints.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default OnboardingPage;

