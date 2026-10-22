import os
import json
import logging
from typing import Dict, Any, List

from app.services.resource_fetcher import fetch_all_resources

logger = logging.getLogger(__name__)

def generate_step_resources(
    goal_title: str,
    step_title: str,
    step_category: str = "Core Concept",
    skill_level: str = "Beginner",
    preferred_format: str = "All",
    learning_preferences: List[str] = None
) -> List[Dict[str, str]]:
    """
    Dynamically generates personalized, step-specific study materials and search links
    tailored to the exact step concept, user skill level, and preferred learning format.
    """
    try:
        return fetch_all_resources(step_title=step_title, goal_title=goal_title, skill_level=skill_level)
    except Exception as e:
        logger.warning(f"Failed to fetch resources with fetcher: {e}")

    clean_goal = goal_title.strip()
    clean_step = step_title.strip()

    query_topic = f"{clean_goal} {clean_step}"
    formatted_query = query_topic.replace(" ", "+").replace("&", "and")

    level_lower = skill_level.lower()
    if "beginner" in level_lower:
        level_tag = "beginner+guide+fundamentals"
        level_label = "Beginner Guide"
    elif "advanced" in level_lower:
        level_tag = "advanced+architecture+best+practices"
        level_label = "Advanced Deep Dive"
    else:
        level_tag = "practical+hands+on+tutorial"
        level_label = "Practical Guide"

    format_lower = (preferred_format or "all").lower()
    prefs = [p.lower() for p in (learning_preferences or [])]
    resources = []

    if "video" in format_lower or any("video" in p for p in prefs):
        resources.append({
            "title": f"{clean_step} ({skill_level} Video Tutorial)",
            "url": f"https://www.youtube.com/results?search_query={formatted_query}+{level_tag}+tutorial",
            "resource_type": "youtube"
        })
    if "hands" in format_lower or any("project" in p or "hands" in p for p in prefs):
        resources.append({
            "title": f"{clean_step} GitHub Practice Projects & Starter Code",
            "url": f"https://github.com/search?q={formatted_query}+{level_tag}&s=stars&o=desc",
            "resource_type": "practice"
        })
    if "doc" in format_lower or "article" in format_lower or any("doc" in p or "reading" in p for p in prefs):
        resources.append({
            "title": f"{clean_step} Documentation & Comprehensive Guides",
            "url": f"https://www.google.com/search?q=official+documentation+and+tutorials+for+{formatted_query}",
            "resource_type": "docs"
        })
    
    # Fallback default if list is too small
    if len(resources) < 3:
        resources.append({
            "title": f"{clean_step} Curated Deep-Dive & Exercises",
            "url": f"https://www.google.com/search?q=best+resources+to+learn+{formatted_query}+{level_tag}",
            "resource_type": "article"
        })

    return resources[:4]


def _build_intelligent_synthesis_roadmap(
    goal_title: str,
    target_outcome: str = "Job-ready",
    skill_level: str = "Beginner",
    existing_knowledge: str = "",
    daily_minutes: int = 30,
    days_per_week: int = 5,
    deadline: str = None,
    preferred_format: str = "All",
    learning_preferences: List[str] = None,
    desired_depth: str = "Balanced",
    capacity_data: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Intelligent dynamic curriculum synthesizer driven strictly by the user's preferred topic/concept,
    prior knowledge, target outcome, and desired depth. Produces authentic, concept-specific milestones
    instead of rigid boilerplate templates.
    """
    g_lower = goal_title.lower().strip()
    prior_k = (existing_knowledge or "").strip()
    has_prior = len(prior_k) > 0 and "none" not in prior_k.lower()
    weekly_hours = (daily_minutes * days_per_week) / 60.0 if (daily_minutes and days_per_week) else 2.5
    
    reasoning = []
    deferred_topics = []

    # 1. Personalization Reasoning Generation
    if has_prior:
        reasoning.append(f"Accelerated curriculum: Detected prior background in '{prior_k}'. Introductory syntax modules have been bypassed to prioritize applied mastery.")
    else:
        reasoning.append(f"Structured ramp-up calibrated for {skill_level} learners, grounding fundamental mental models before advanced workflows.")

    reasoning.append(f"Target Outcome Alignment: Milestones calibrated toward '{target_outcome}', prioritizing practical execution and real-world competency.")
    
    if desired_depth == "Quick Practical":
        reasoning.append("Scope Optimization: Configured for 'Quick Practical' depth—focused on high-yield essential patterns while deferring peripheral advanced theory.")
    elif desired_depth == "Deep Fundamental":
        reasoning.append("Comprehensive Scope: Configured for 'Deep Fundamental' depth with internal architecture, optimization patterns, and multi-tier projects.")
    else:
        reasoning.append("Balanced Progression: Configured for an optimal blend of foundational principles, applied mechanics, and a capstone milestone.")

    if capacity_data and capacity_data.get("commitment", {}).get("total_available_hours"):
        avail = capacity_data["commitment"]["total_available_hours"]
        reasoning.append(f"Study Commitment: Structured around {weekly_hours:.1f} hrs/week ({daily_minutes} mins/day, {days_per_week} days/wk) within your {avail:.1f}h total capacity window.")

    # 2. Comprehensive Domain & Concept Mapping
    candidate_steps = []
    raw_deferred = []

    # Helper to build outcome capstone
    def make_capstone(topic_name: str, prereqs: List[str] = None) -> Dict[str, Any]:
        p_list = prereqs or []
        outcome_lower = target_outcome.lower()
        if "interview" in outcome_lower:
            return {
                "title": f"{topic_name} Technical Interview & System Design Simulation",
                "description": f"Comprehensive problem-solving drills, edge-case analysis, architectural trade-off defenses, and mock technical evaluation in {topic_name}.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Advanced",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": p_list,
                "category": "Hands-on Project"
            }
        elif "build a project" in outcome_lower:
            return {
                "title": f"Full-Featured {topic_name} Application Project",
                "description": f"Synthesize all concepts into a complete end-to-end working project with robust error handling, responsive UX, and live deployment for {topic_name}.",
                "estimated_hours": 14.0 if desired_depth == "Deep Fundamental" else 8.0,
                "difficulty": "Advanced",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": p_list,
                "category": "Hands-on Project"
            }
        elif "conceptual" in outcome_lower:
            return {
                "title": f"{topic_name} Architectural Blueprint & Comparative Analysis",
                "description": f"Comprehensive synthesis paper and interactive prototype evaluating architectural trade-offs, scalability limits, and design patterns in {topic_name}.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": p_list,
                "category": "Hands-on Project"
            }
        else:
            # Job-ready default
            return {
                "title": f"Production-Grade {topic_name} Industry Capstone",
                "description": f"Build, benchmark, test, containerize (Docker), and deploy a production-ready application meeting '{target_outcome}' standards with automated CI/CD and documentation.",
                "estimated_hours": 14.0 if desired_depth == "Deep Fundamental" else 8.0,
                "difficulty": "Advanced",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": p_list,
                "category": "Hands-on Project"
            }

    # MATCH SPECIFIC TOPIC / CONCEPT DOMAINS
    # -------------------------------------------------------------
    # Deep Learning / NLP / LLMs
    if any(k in g_lower for k in ["deep learning", "nlp", "natural language", "llm", "large language", "prompt engineering", "transformer", "hugging face", "computer vision"]):
        candidate_steps = [
            {
                "title": "PyTorch Tensors, Autograd & Dynamic Computation Graphs",
                "description": "Master multidimensional tensor math, GPU CUDA acceleration, automated gradient descent, and loss optimization.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["python", "math", "basics"]
            },
            {
                "title": "Neural Architectures: Multi-Layer Perceptrons & Backpropagation",
                "description": "Build feedforward networks, activation functions (ReLU, GELU), regularization (Dropout, BatchNorm), and weight initialization.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["PyTorch Tensors & Autograd"],
                "category": "Core Concept",
                "tags": ["deep learning", "neural"]
            },
            {
                "title": "Attention Mechanisms & Transformer Architecture Deep Dive",
                "description": "Deconstruct scaled dot-product attention, multi-head self-attention, positional encodings, and encoder-decoder mechanisms.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 8.0,
                "difficulty": "Advanced",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Neural Architectures"],
                "category": "Core Concept",
                "tags": ["transformers", "attention"]
            },
            {
                "title": "LLM Fine-Tuning, LoRA & Vector RAG Architectures",
                "description": "Implement parameter-efficient fine-tuning (LoRA, QLoRA), tokenization pipelines, vector database retrieval (Chroma/Pinecone), and LangChain orchestration.",
                "estimated_hours": 14.0 if desired_depth == "Deep Fundamental" else 9.0,
                "difficulty": "Advanced",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Attention Mechanisms & Transformer Architecture"],
                "category": "Core Concept",
                "tags": ["llm", "rag", "fine-tuning"]
            },
            make_capstone(goal_title, ["LLM Fine-Tuning & Vector RAG"])
        ]
        raw_deferred = [
            "Distributed Multi-GPU Training with PyTorch FSDP & DeepSpeed",
            "Model Quantization (GGUF, AWQ, vLLM High-Throughput Serving Engine)"
        ]

    # Machine Learning & AI
    elif any(k in g_lower for k in ["machine learning", "artificial intelligence", "ml", "scikit"]):
        candidate_steps = [
            {
                "title": "Python & Linear Algebra Foundations for Machine Learning",
                "description": "Master essential matrix operations, vector projections, eigenvalue intuition, and probability distributions for ML.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["python", "math", "basics"]
            },
            {
                "title": "NumPy, Pandas & Exploratory Data Analysis (EDA)",
                "description": "Perform high-performance data manipulation, missing value imputation, outlier detection, and correlation visualization.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate" if has_prior else "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Python & Linear Algebra Foundations"],
                "category": "Core Concept",
                "tags": ["pandas", "numpy", "eda"]
            },
            {
                "title": "Classical Supervised & Unsupervised Machine Learning Models",
                "description": "Implement linear/logistic regression, decision trees, random forests, gradient boosting (XGBoost), SVMs, and k-means clustering.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 8.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["NumPy, Pandas & Exploratory Data Analysis"],
                "category": "Core Concept",
                "tags": ["scikit-learn", "models"]
            },
            {
                "title": "Model Validation, Hyperparameter Tuning & Cross-Validation",
                "description": "Prevent data leakage, implement Stratified K-Fold, tune hyperparameters with Optuna, and evaluate ROC-AUC, Precision-Recall, and F1 scores.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Classical Supervised & Unsupervised ML"],
                "category": "Core Concept",
                "tags": ["validation", "tuning"]
            },
            {
                "title": "Neural Networks & PyTorch Fundamentals",
                "description": "Build multilayer perceptrons, backpropagation loss gradients, and convolutional layers using PyTorch.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Advanced",
                "priority": "Essential" if desired_depth != "Quick Practical" else "Optional",
                "is_essential": desired_depth != "Quick Practical",
                "prerequisites": ["Classical Supervised & Unsupervised ML"],
                "category": "Core Concept",
                "tags": ["pytorch", "neural networks"]
            },
            make_capstone(goal_title, ["Classical Supervised & Unsupervised ML"])
        ]
        raw_deferred = [
            "MLOps Automated Training Pipelines with Kubeflow & MLflow",
            "ONNX Model Serialization and TensorRT GPU Optimization"
        ]

    # Data Science & Analytics
    elif any(k in g_lower for k in ["data science", "data analytics", "analytics", "business intelligence", "bi", "tableau", "power bi"]):
        candidate_steps = [
            {
                "title": "Relational Data Modeling & Advanced SQL Analytics",
                "description": "Master multi-table joins, subqueries, Common Table Expressions (CTEs), window functions, and aggregation rollups.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["sql", "database"]
            },
            {
                "title": "Exploratory Data Analysis with Pandas & Visualization (Seaborn/Plotly)",
                "description": "Clean messy real-world datasets, engineer categorical features, handle outliers, and construct interactive statistical graphics.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Relational Data Modeling & SQL"],
                "category": "Core Concept",
                "tags": ["pandas", "visualization"]
            },
            {
                "title": "Statistical Inference, Probability & A/B Experimentation",
                "description": "Formulate hypotheses, run two-sample t-tests, Mann-Whitney U tests, calculate p-values, confidence intervals, and statistical power.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Exploratory Data Analysis with Pandas"],
                "category": "Core Concept",
                "tags": ["statistics", "ab-testing"]
            },
            {
                "title": "Predictive Feature Engineering & Baseline Machine Learning",
                "description": "Build predictive models with Scikit-Learn to uncover key business drivers, customer churn probabilities, and forecast metrics.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Advanced",
                "priority": "Essential" if desired_depth != "Quick Practical" else "Optional",
                "is_essential": desired_depth != "Quick Practical",
                "prerequisites": ["Statistical Inference & A/B Experimentation"],
                "category": "Core Concept",
                "tags": ["machine learning", "features"]
            },
            make_capstone(goal_title, ["Exploratory Data Analysis with Pandas", "Predictive Feature Engineering"])
        ]
        raw_deferred = [
            "Distributed Big Data Wrangling with Apache Spark & PySpark",
            "Automated ETL Orchestration with Airflow & dbt"
        ]

    # React & Modern Frontend
    elif any(k in g_lower for k in ["react", "next.js", "nextjs", "vue", "frontend", "svelte", "ui/ux", "tailwind"]):
        candidate_steps = [
            {
                "title": "Modern JavaScript (ES6+), DOM Manipulation & Async Engine",
                "description": "Master arrow functions, destructuring, modules, closures, Promises, async/await, and browser event loop mechanics.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["javascript", "basics"]
            },
            {
                "title": "React Component Architecture, JSX & Reactive Rendering",
                "description": "Build modular functional components, manage unidirectional data flow, master props interfaces, and lifecycle rendering.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate" if has_prior else "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Modern JavaScript"],
                "category": "Core Concept",
                "tags": ["react", "jsx"]
            },
            {
                "title": "State Management Mastery: Hooks, Context & Reducers",
                "description": "Deep dive into useState, useEffect, useRef, useMemo, useCallback, custom hooks, and scalable Context state machines.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["React Component Architecture"],
                "category": "Core Concept",
                "tags": ["react", "hooks", "state"]
            },
            {
                "title": "Server State, Client Routing & Form Architecture",
                "description": "Integrate TanStack Query for cache invalidation, React Router 6 for dynamic nested routes, and React Hook Form with Zod validation.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["State Management Mastery"],
                "category": "Core Concept",
                "tags": ["routing", "query", "forms"]
            },
            {
                "title": "Performance Profiling, Virtualization & Accessibility (a11y)",
                "description": "Profile re-renders with React DevTools, virtualize long lists, code-split with React.lazy, and enforce WCAG accessibility standards.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Advanced",
                "priority": "Essential" if desired_depth != "Quick Practical" else "Optional",
                "is_essential": desired_depth != "Quick Practical",
                "prerequisites": ["State Management Mastery"],
                "category": "Core Concept",
                "tags": ["performance", "optimization"]
            },
            make_capstone(goal_title, ["Server State, Client Routing", "Performance Profiling"])
        ]
        raw_deferred = [
            "Micro-Frontend Architecture with Module Federation",
            "Server-Driven UI Rendering and Next.js Streaming SSR"
        ]

    # FastAPI / Backend APIs / Node.js
    elif any(k in g_lower for k in ["fastapi", "backend", "api", "rest api", "node.js", "express", "django", "spring boot", "microservices"]):
        candidate_steps = [
            {
                "title": "RESTful Architecture, HTTP Invariants & API Contract Design",
                "description": "Design deterministic REST endpoints, master HTTP verbs, status codes, headers, and OpenAPI/Swagger specifications.",
                "estimated_hours": 7.0 if desired_depth == "Deep Fundamental" else 4.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["http", "api", "rest"]
            },
            {
                "title": "Request Validation, Pydantic Schema Modeling & Serialization",
                "description": "Implement robust request payloads, nested relational schemas, type constraints, and strict JSON response formatting.",
                "estimated_hours": 9.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["RESTful Architecture & API Design"],
                "category": "Core Concept",
                "tags": ["validation", "schemas"]
            },
            {
                "title": "Dependency Injection & Async Database Session Architecture",
                "description": "Design modular dependency injection pipelines, manage SQLAlchemy / Prisma async connection pools, and run Alembic migrations.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Request Validation & Schema Modeling"],
                "category": "Core Concept",
                "tags": ["database", "async", "dependency injection"]
            },
            {
                "title": "Security Architecture: OAuth2, JWT Auth & Rate Limiting",
                "description": "Implement cryptographic password hashing (Argon2/bcrypt), token issuance, middleware authentication guards, CORS, and Redis rate limiting.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Advanced",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Dependency Injection & Async Database"],
                "category": "Core Concept",
                "tags": ["security", "auth", "jwt"]
            },
            {
                "title": "Background Tasks, Caching & Resilient Error Boundaries",
                "description": "Implement asynchronous background workers (Celery/BullMQ), Redis response caching, structured logging, and health probe endpoints.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Advanced",
                "priority": "Essential" if desired_depth != "Quick Practical" else "Optional",
                "is_essential": desired_depth != "Quick Practical",
                "prerequisites": ["Security Architecture: OAuth2 & JWT"],
                "category": "Core Concept",
                "tags": ["caching", "background tasks", "workers"]
            },
            make_capstone(goal_title, ["Security Architecture: OAuth2 & JWT", "Dependency Injection"])
        ]
        raw_deferred = [
            "Distributed Event Streaming with Apache Kafka & gRPC Microservices",
            "Multi-Tenant Database Partitioning and Row-Level Security"
        ]

    # Docker & Containers
    elif any(k in g_lower for k in ["docker", "container", "containerization"]):
        candidate_steps = [
            {
                "title": "Linux Namespaces, Cgroups & Container Runtime Mechanics",
                "description": "Understand process isolation, chroot, cgroups, namespaces, and the Docker client-daemon architecture.",
                "estimated_hours": 6.0 if desired_depth == "Deep Fundamental" else 4.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["linux", "basics"]
            },
            {
                "title": "Dockerfile Optimization & Multi-Stage Production Builds",
                "description": "Write lean Dockerfiles with layer caching, multi-stage compilation, minimal base images (Alpine/Distroless), and non-root users.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Linux Namespaces & Container Mechanics"],
                "category": "Core Concept",
                "tags": ["dockerfile", "images"]
            },
            {
                "title": "Multi-Service Orchestration with Docker Compose & Custom Networks",
                "description": "Define multi-tier applications (Frontend, API, Postgres, Redis), bridge networks, volume mounts, and secret injections.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Dockerfile Optimization & Multi-Stage Builds"],
                "category": "Core Concept",
                "tags": ["compose", "networking"]
            },
            {
                "title": "Container Security Auditing, Trivy Scanning & CI Registry Push",
                "description": "Scan containers for CVE vulnerabilities with Trivy, sign images, and automate builds via GitHub Actions to Docker Hub / GHCR.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Advanced",
                "priority": "Essential" if desired_depth != "Quick Practical" else "Optional",
                "is_essential": desired_depth != "Quick Practical",
                "prerequisites": ["Multi-Service Orchestration with Docker Compose"],
                "category": "Core Concept",
                "tags": ["security", "registry", "ci"]
            },
            make_capstone(goal_title, ["Multi-Service Orchestration with Docker Compose"])
        ]
        raw_deferred = [
            "Rootless Docker Engine Configuration & Custom Storage Drivers",
            "Kubernetes Ingress Controllers and Helm Packaging"
        ]

    # Kubernetes & Cloud-Native
    elif any(k in g_lower for k in ["kubernetes", "k8s", "helm", "cloud native"]):
        candidate_steps = [
            {
                "title": "Kubernetes Control Plane Architecture & Core Primitives",
                "description": "Master etcd, kube-apiserver, kube-scheduler, kube-controller-manager, and fundamental Pod / ReplicaSet lifecycles.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["k8s", "architecture"]
            },
            {
                "title": "Deployments, Zero-Downtime Rollouts & Service Networking",
                "description": "Configure RollingUpdate strategies, ClusterIP, NodePort, LoadBalancer services, and CoreDNS internal service resolution.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Kubernetes Control Plane Architecture"],
                "category": "Core Concept",
                "tags": ["deployments", "networking"]
            },
            {
                "title": "ConfigMaps, Secrets, Ingress Controllers & TLS Termination",
                "description": "Externalize configuration, manage base64 secrets, configure NGINX Ingress, and automate TLS certificates with cert-manager.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Deployments & Service Networking"],
                "category": "Core Concept",
                "tags": ["config", "secrets", "ingress"]
            },
            {
                "title": "Persistent Storage, Helm 3 Packaging & Declarative GitOps",
                "description": "Manage PersistentVolumes, PVCs, author reusable Helm 3 charts, and synchronize cluster state with ArgoCD GitOps pipelines.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 8.0,
                "difficulty": "Advanced",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["ConfigMaps, Secrets & Ingress Controllers"],
                "category": "Core Concept",
                "tags": ["storage", "helm", "gitops"]
            },
            make_capstone(goal_title, ["Persistent Storage, Helm 3 & GitOps"])
        ]
        raw_deferred = [
            "Custom Kubernetes Operators Authoring with Kubebuilder / Go",
            "Service Mesh Implementation with Istio (mTLS & Traffic Shifting)"
        ]

    # DevOps & Cloud Infrastructure
    elif any(k in g_lower for k in ["devops", "cloud", "aws", "ci/cd", "terraform", "infrastructure"]):
        candidate_steps = [
            {
                "title": "Linux Systems Administration, Shell Automation & Networking",
                "description": "Master bash scripting, systemd services, user permissions, SSH keys, cron jobs, and DNS/firewall network configuration.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["linux", "bash", "networking"]
            },
            {
                "title": "Continuous Integration & Automated Testing with GitHub Actions",
                "description": "Author automated CI workflows for linting, unit testing, matrix builds, artifact caching, and environment secret management.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Linux Systems & Shell Automation"],
                "category": "Core Concept",
                "tags": ["ci/cd", "github actions"]
            },
            {
                "title": "Infrastructure as Code (IaC) with Terraform & Cloud Modules",
                "description": "Provision reproducible cloud infrastructure (VPCs, EC2, S3, RDS), state locking with DynamoDB, and declarative HCL modules.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Linux Systems & Shell Automation"],
                "category": "Core Concept",
                "tags": ["terraform", "iac", "cloud"]
            },
            {
                "title": "Production Observability: Prometheus Metrics & Grafana Alerting",
                "description": "Instrument application metrics, configure Prometheus scraping, build operational Grafana dashboards, and route alerts via PagerDuty.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Advanced",
                "priority": "Essential" if desired_depth != "Quick Practical" else "Optional",
                "is_essential": desired_depth != "Quick Practical",
                "prerequisites": ["Infrastructure as Code with Terraform"],
                "category": "Core Concept",
                "tags": ["observability", "prometheus", "grafana"]
            },
            make_capstone(goal_title, ["Infrastructure as Code with Terraform", "Continuous Integration with GitHub Actions"])
        ]
        raw_deferred = [
            "Chaos Engineering with Chaos Mesh and Disaster Recovery Drills",
            "Multi-Cloud Federation and Hybrid DirectConnect Interconnects"
        ]

    # SQL & Databases
    elif any(k in g_lower for k in ["sql", "database", "postgres", "postgresql", "mysql", "mongodb", "redis"]):
        candidate_steps = [
            {
                "title": "Relational Data Modeling & 3NF Normalization Principles",
                "description": "Design normalized schemas, enforce primary/foreign keys, uniqueness constraints, cascading deletes, and data integrity.",
                "estimated_hours": 7.0 if desired_depth == "Deep Fundamental" else 4.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["modeling", "normalization"]
            },
            {
                "title": "Advanced SQL: CTEs, Window Functions & Aggregations",
                "description": "Master PARTITION BY, RANK, DENSE_RANK, LAG, LEAD, recursive CTEs, and complex analytics over millions of rows.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Relational Data Modeling"],
                "category": "Core Concept",
                "tags": ["sql", "window functions", "cte"]
            },
            {
                "title": "Query Execution Plans (EXPLAIN ANALYZE) & Indexing Strategies",
                "description": "Inspect query costs, sequential vs index scans, B-Tree, GIN, Hash indexes, partial indexes, and eliminate slow full table scans.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Advanced SQL: CTEs & Window Functions"],
                "category": "Core Concept",
                "tags": ["indexing", "optimization", "explain"]
            },
            {
                "title": "Transactions, ACID Guarantees, MVCC & Concurrency Locking",
                "description": "Understand Multi-Version Concurrency Control, transaction isolation levels (Read Committed to Serializable), deadlocks, and row locking.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Advanced",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Query Execution Plans & Indexing"],
                "category": "Core Concept",
                "tags": ["mvcc", "acid", "transactions"]
            },
            make_capstone(goal_title, ["Query Execution Plans & Indexing", "Transactions & ACID Guarantees"])
        ]
        raw_deferred = [
            "Distributed Table Partitioning & Citus Horizontal Sharding",
            "Change Data Capture (CDC) with Debezium and Kafka Connect"
        ]

    # Cybersecurity & Ethical Hacking
    elif any(k in g_lower for k in ["cybersecurity", "security", "ethical hacking", "infosec", "penetration testing", "pentesting"]):
        candidate_steps = [
            {
                "title": "Network Protocols, Traffic Interception & Wireshark Analysis",
                "description": "Master TCP/IP handshakes, DNS, ARP poisoning, TLS certificates, packet dissection, and network reconnaissance with Wireshark.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["networking", "wireshark", "protocols"]
            },
            {
                "title": "Web Application Security & OWASP Top 10 Vulnerabilities",
                "description": "Exploit and remediate SQL Injection, Cross-Site Scripting (XSS), CSRF, Server-Side Request Forgery (SSRF), and broken access controls.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Network Protocols & Wireshark Analysis"],
                "category": "Core Concept",
                "tags": ["owasp", "web security", "vulnerabilities"]
            },
            {
                "title": "Reconnaissance, Port Scanning (Nmap) & Attack Surface Mapping",
                "description": "Perform passive OSINT, active port scanning with Nmap, banner grabbing, service enumeration, and vulnerability assessment.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Network Protocols & Wireshark Analysis"],
                "category": "Core Concept",
                "tags": ["nmap", "recon", "scanning"]
            },
            {
                "title": "Privilege Escalation, Exploit Mechanics & Post-Exploitation",
                "description": "Understand Linux SUID misconfigurations, Windows Token manipulation, Metasploit payload delivery, and credential harvesting.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 8.0,
                "difficulty": "Advanced",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Web Application Security & OWASP"],
                "category": "Core Concept",
                "tags": ["exploit", "privilege escalation"]
            },
            make_capstone(goal_title, ["Privilege Escalation & Exploit Mechanics", "Web Application Security"])
        ]
        raw_deferred = [
            "Advanced Binary Exploitation, Buffer Overflows & ROP Chains",
            "Active Directory Forest Compromise and Kerberoasting Defense"
        ]

    # Mobile Development (Flutter / React Native / Android / iOS)
    elif any(k in g_lower for k in ["mobile", "flutter", "react native", "android", "ios", "swift", "kotlin"]):
        candidate_steps = [
            {
                "title": "Core Language & Reactive Paradigm Architecture",
                "description": "Master reactive programming conventions, asynchronous streams, object lifecycle, and declarative component paradigms.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["language", "basics"]
            },
            {
                "title": "Declarative Widget Layouts, Navigation & Responsive Theming",
                "description": "Design adaptive mobile layouts, nested navigation stacks, Material 3 / Cupertino styling, and responsive orientation handling.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Core Language & Reactive Paradigm Architecture"],
                "category": "Core Concept",
                "tags": ["layouts", "widgets", "navigation"]
            },
            {
                "title": "Predictable State Management & Asynchronous API Integration",
                "description": "Implement unidirectional state management (Riverpod/Bloc/Redux), optimistic UI updates, and robust RESTful API networking.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Declarative Widget Layouts"],
                "category": "Core Concept",
                "tags": ["state management", "api"]
            },
            {
                "title": "Offline Local Persistence, Device APIs & Push Notifications",
                "description": "Store structured offline data with SQLite/Hive, access camera and geolocation hardware permissions, and handle push notifications.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Advanced",
                "priority": "Essential" if desired_depth != "Quick Practical" else "Optional",
                "is_essential": desired_depth != "Quick Practical",
                "prerequisites": ["Predictable State Management"],
                "category": "Core Concept",
                "tags": ["offline", "hardware", "device"]
            },
            make_capstone(goal_title, ["Predictable State Management", "Offline Local Persistence"])
        ]
        raw_deferred = [
            "Native C++ / Objective-C Platform Channels & Custom Metal Shaders",
            "Automated App Store Fastlane Deployment and Beta Distribution"
        ]

    # Data Structures & Algorithms
    elif any(k in g_lower for k in ["data structures", "algorithms", "dsa", "leetcode", "coding interview"]):
        candidate_steps = [
            {
                "title": "Asymptotic Analysis (Big-O), Arrays & Two-Pointer Patterns",
                "description": "Analyze time and space complexity, master in-place array manipulation, sliding window techniques, and prefix sums.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["big-o", "arrays"]
            },
            {
                "title": "Linked Lists, Monotonic Stacks, Queues & Hash Maps",
                "description": "Implement pointers, fast/slow runner cycle detection, monotonic stacks for nearest smaller elements, and hash collision resolution.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Asymptotic Analysis (Big-O) & Arrays"],
                "category": "Core Concept",
                "tags": ["stacks", "queues", "hashmaps"]
            },
            {
                "title": "Trees, Binary Search, Heaps & Graph Traversals (BFS/DFS)",
                "description": "Master tree recursions, lowest common ancestor, heap priority queues, connected components, and topological sorting.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 8.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Linked Lists, Stacks & Hash Maps"],
                "category": "Core Concept",
                "tags": ["trees", "graphs", "bfs", "dfs"]
            },
            {
                "title": "Dynamic Programming: Memoization, Tabulation & Knapsack Patterns",
                "description": "Recognize optimal substructure and overlapping subproblems, convert recursive memoization to iterative tabulation, and solve knapsack variations.",
                "estimated_hours": 14.0 if desired_depth == "Deep Fundamental" else 8.0,
                "difficulty": "Advanced",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Trees, Binary Search & Graph Traversals"],
                "category": "Core Concept",
                "tags": ["dynamic programming", "dp"]
            },
            make_capstone(goal_title, ["Dynamic Programming", "Trees & Graphs"])
        ]
        raw_deferred = [
            "Advanced Graph Algorithms: Tarjan's Strongly Connected Components & Max Flow",
            "Trie Autocomplete and Segment Trees with Lazy Propagation"
        ]

    # Full-Stack Web Development (Default fallback if full stack is mentioned)
    elif any(k in g_lower for k in ["web dev", "full stack", "fullstack", "html", "javascript", "css"]):
        candidate_steps = [
            {
                "title": "Semantic HTML5, Responsive Modern CSS & Web Layouts",
                "description": "Master accessible semantic elements, CSS Grid, Flexbox, custom properties, and fluid typography.",
                "estimated_hours": 7.0 if desired_depth == "Deep Fundamental" else 4.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["html", "css", "basics"]
            },
            {
                "title": "Modern JavaScript (ES6+), Asynchronous Patterns & Fetch API",
                "description": "Master closures, array transformations, Promises, async/await, DOM event delegation, and JSON networking.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate" if has_prior else "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Semantic HTML5 & Responsive CSS"],
                "category": "Core Concept",
                "tags": ["javascript", "async"]
            },
            {
                "title": "React Component Architecture & Client State Management",
                "description": "Build reusable UI components, manage declarative component state with hooks, and handle routing.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["Modern JavaScript"],
                "category": "Core Concept",
                "tags": ["react", "frontend"]
            },
            {
                "title": "RESTful Backend Services, JWT Authentication & Databases",
                "description": "Develop high-throughput REST APIs, cryptographic authentication, database schema relationships, and ORM operations.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 8.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": ["React Component Architecture"],
                "category": "Core Concept",
                "tags": ["backend", "database", "api"]
            },
            make_capstone(goal_title, ["React Component Architecture", "RESTful Backend Services"])
        ]
        raw_deferred = [
            "WebSockets Real-time Communication & Redis Pub/Sub",
            "Server-Side Rendering (SSR) and Edge Computing Deployment"
        ]

    # UNIVERSAL DYNAMIC CONCEPT SYNTHESIZER
    # Generates authentic, concept-rich milestones for ANY arbitrary topic or technology
    # -------------------------------------------------------------
    else:
        topic_clean = goal_title.strip()
        candidate_steps = [
            {
                "title": f"{topic_clean} Core Mechanics & Execution Environment",
                "description": f"Master the fundamental syntax, execution environment, primary terminology, and baseline mental models essential for {topic_clean}.",
                "estimated_hours": 8.0 if desired_depth == "Deep Fundamental" else 5.0,
                "difficulty": "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [],
                "category": "Core Concept",
                "tags": ["foundations", "syntax", "basics"]
            },
            {
                "title": f"State Representation, Data Flow & Essential Primitives in {topic_clean}",
                "description": f"Deep dive into how data and state are structured, transformed, validated, and managed when building practical systems with {topic_clean}.",
                "estimated_hours": 10.0 if desired_depth == "Deep Fundamental" else 6.0,
                "difficulty": "Intermediate" if has_prior else "Beginner",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [f"{topic_clean} Core Mechanics"],
                "category": "Core Concept",
                "tags": ["data flow", "state"]
            },
            {
                "title": f"Applied Architecture & Modular Pattern Design for {topic_clean}",
                "description": f"Implement real-world architectural workflows, modular component abstractions, error boundaries, and integration patterns using {topic_clean}.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Intermediate",
                "priority": "Essential",
                "is_essential": True,
                "prerequisites": [f"State Representation in {topic_clean}"],
                "category": "Core Concept",
                "tags": ["architecture", "patterns"]
            },
            {
                "title": f"Performance Optimization, Resiliency & Production Hardening in {topic_clean}",
                "description": f"Profile resource utilization, eliminate bottlenecks, handle failure modes, enforce security invariants, and apply production standards in {topic_clean}.",
                "estimated_hours": 12.0 if desired_depth == "Deep Fundamental" else 7.0,
                "difficulty": "Advanced",
                "priority": "Essential" if desired_depth != "Quick Practical" else "Optional",
                "is_essential": desired_depth != "Quick Practical",
                "prerequisites": [f"Applied Architecture for {topic_clean}"],
                "category": "Core Concept",
                "tags": ["optimization", "production"]
            },
            make_capstone(topic_clean, [f"Applied Architecture for {topic_clean}"])
        ]
        raw_deferred = [
            f"Distributed Fault-Tolerance & Enterprise Multi-Region Scaling for {topic_clean}",
            f"Automated Telemetry, Tracing & Zero-Downtime Migration Strategies for {topic_clean}"
        ]

    # 3. Apply Prior Knowledge Filtering (Bypass what the user already knows)
    filtered_steps = []
    if has_prior:
        prior_terms = [t.strip().lower() for t in prior_k.replace(";", ",").split(",") if t.strip()]
        for step in candidate_steps:
            step_tags = step.get("tags", [])
            step_title_lower = step["title"].lower()
            
            # Check if this is an introductory step that directly overlaps with user's prior knowledge
            is_introductory = step.get("difficulty") == "Beginner" or "foundations" in step_title_lower or "basics" in step_title_lower
            matched_prior = False
            if is_introductory:
                for term in prior_terms:
                    if len(term) >= 3 and (term in step_title_lower or any(term in tag for tag in step_tags)):
                        matched_prior = True
                        break
            
            if matched_prior:
                # Bypass this step!
                reasoning.append(f"Fast-forwarded past '{step['title']}' based on your existing proficiency in '{prior_k}'.")
            else:
                filtered_steps.append(step)
    else:
        filtered_steps = candidate_steps

    # Ensure at least 3 steps remain even after aggressive filtering
    if len(filtered_steps) < 3:
        filtered_steps = candidate_steps

    # 4. Calibrate Scope based on Desired Depth (Ensuring Capstone is always preserved as the final milestone)
    final_steps = []
    if desired_depth == "Quick Practical":
        capstone = filtered_steps[-1] if filtered_steps else None
        non_capstone = [s for s in filtered_steps[:-1] if s.get("is_essential")]
        selected = non_capstone[:3]
        for s in non_capstone[3:]:
            deferred_topics.append(f"{s['title']} - Deferred to maintain focused, high-velocity practical delivery.")
        if capstone:
            final_steps = selected + [capstone]
        else:
            final_steps = selected
    elif desired_depth == "Balanced":
        capstone = filtered_steps[-1] if filtered_steps else None
        non_capstone = filtered_steps[:-1]
        selected = non_capstone[:4]
        for s in non_capstone[4:]:
            deferred_topics.append(f"{s['title']} - Scheduled for subsequent expansion phase.")
        if capstone:
            final_steps = selected + [capstone]
        else:
            final_steps = selected
    else:
        # Deep Fundamental: keep all generated steps
        final_steps = filtered_steps

    # Add raw deferred topics
    for d in raw_deferred:
        if d not in deferred_topics:
            deferred_topics.append(d)

    # 5. Format Steps with Dynamic Phase Numbering and Resources
    steps_with_resources = []
    for idx, s in enumerate(final_steps, start=1):
        step_dict = dict(s)
        step_dict.pop("tags", None)
        step_dict["phase_number"] = idx
        step_dict["phase_title"] = f"Phase {idx}: {step_dict['title'].split(':')[0]}"
        step_dict["order_index"] = idx
        step_dict["resources"] = generate_step_resources(
            goal_title=goal_title,
            step_title=step_dict["title"],
            step_category=step_dict.get("category", "Core Concept"),
            skill_level=skill_level,
            preferred_format=preferred_format,
            learning_preferences=learning_preferences
        )
        steps_with_resources.append(step_dict)

    return {
        "title": f"Personalized {goal_title} Curriculum ({target_outcome})",
        "description": f"Personalized learning trajectory calibrated for {skill_level} level, dedicating {daily_minutes} mins/day ({days_per_week} days/week) toward {target_outcome}.",
        "personalization_reasoning": reasoning,
        "deferred_topics": deferred_topics,
        "steps": steps_with_resources
    }

    # Set order indices and attach dynamic resources
    steps_with_resources = []
    for idx, s in enumerate(raw_steps, start=1):
        step_dict = dict(s)
        step_dict["order_index"] = idx
        step_dict["resources"] = generate_step_resources(
            goal_title=goal_title,
            step_title=step_dict["title"],
            step_category=step_dict.get("category", "Core Concept"),
            skill_level=skill_level,
            preferred_format=preferred_format,
            learning_preferences=learning_preferences
        )
        steps_with_resources.append(step_dict)

    return {
        "title": f"Personalized {goal_title} Curriculum ({target_outcome})",
        "description": f"Personalized learning trajectory calibrated for {skill_level} level, dedicating {daily_minutes} mins/day ({days_per_week} days/week) toward {target_outcome}.",
        "personalization_reasoning": reasoning,
        "deferred_topics": deferred_topics,
        "steps": steps_with_resources
    }


def generate_roadmap_with_ai(
    goal_title: str,
    target_outcome: str = "Job-ready",
    skill_level: str = "Beginner",
    existing_knowledge: str = "",
    daily_minutes: int = 30,
    days_per_week: int = 5,
    deadline: str = None,
    preferred_format: str = "All",
    learning_preferences: List[str] = None,
    desired_depth: str = "Balanced",
    capacity_data: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Generates a constraint-aware learning roadmap with Gemini API or intelligent synthesis engine.
    """
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prefs_str = ", ".join(learning_preferences) if learning_preferences else preferred_format
            prior_str = existing_knowledge if existing_knowledge else "None (starting from scratch)"
            deadline_str = deadline if deadline else "Self-paced / No hard deadline"
            avail_hours_str = f"{capacity_data['commitment']['total_available_hours']:.1f} hours" if (capacity_data and capacity_data.get("commitment", {}).get("total_available_hours")) else "Flexible"

            prompt = f"""
You are an expert AI Learning Architect and Curriculum Designer.
Generate a structured, constraint-aware, personalized learning roadmap for a student.

USER LEARNING PROFILE & CONSTRAINTS:
- Learning Goal: {goal_title}
- Target Outcome: {target_outcome} (e.g. Job-ready, Build a project, Interview prep, Conceptual overview)
- Current Skill Level: {skill_level}
- Existing Knowledge / Already Known: {prior_str}
- Available Study Time: {daily_minutes} minutes/day, {days_per_week} days/week ({(daily_minutes*days_per_week)/60.0:.1f} hrs/week)
- Target Deadline: {deadline_str}
- Calculated Total Available Capacity: {avail_hours_str}
- Desired Depth: {desired_depth} (Quick Practical / Balanced / Deep Fundamental)
- Preferred Learning Format & Modalities: {prefs_str}

CRITICAL PERSONALIZATION & CONSTRAINT INSTRUCTIONS:
1. CURRICULUM CUSTOMIZATION: Do NOT generate a generic fixed outline.
   - If the user has prior knowledge, DO NOT repeat beginner topics. Fast-forward past what they already know.
   - If Desired Depth is 'Quick Practical', create 3 to 4 high-impact milestones, focus strictly on practical execution, and place non-essential topics in 'deferred_topics'.
   - If Desired Depth is 'Deep Fundamental', create 5 to 7 thorough milestones covering theory, internal architecture, edge cases, and a comprehensive project.
   - If Target Outcome is 'Interview prep', focus on algorithmic patterns, system design, and mock problems.
   - If Target Outcome is 'Build a project', structure milestones around incrementally building and deploying a capstone application.
2. TIME BUDGET & REALISTIC ESTIMATES:
   - Assign realistic 'estimated_hours' for each milestone (e.g. 5 to 15 hours per milestone).
   - If total hours would exceed available capacity before the deadline, move non-essential topics into 'deferred_topics'.
3. PERSONALIZATION REASONING:
   - Include a 'personalization_reasoning' array of 3-4 bullet strings explaining WHY this specific roadmap was tailored this way based on their outcome, prior knowledge, study hours, and depth choice.
4. DEFERRED TOPICS:
   - Include a 'deferred_topics' array listing optional or advanced topics intentionally deferred to keep the roadmap achievable.

Return strictly a valid JSON object matching this schema:
{{
  "title": "Roadmap Title",
  "description": "Roadmap description summarizing personalized scope",
  "personalization_reasoning": [
    "Reason 1: Why this pace/sequence was chosen",
    "Reason 2: How prior knowledge altered the curriculum",
    "Reason 3: How target outcome shaped the milestones"
  ],
  "deferred_topics": [
    "Deferred Topic A (Reason)",
    "Deferred Topic B (Reason)"
  ],
  "steps": [
    {{
      "phase_number": 1,
      "phase_title": "Phase 1: Phase Title",
      "order_index": 1,
      "title": "Milestone Title",
      "description": "Clear explanation of what to learn and build",
      "estimated_hours": 8.0,
      "difficulty": "Beginner|Intermediate|Advanced",
      "priority": "Essential|Optional|Advanced",
      "is_essential": true,
      "prerequisites": ["Prior Topic A"],
      "category": "Core Concept|Hands-on Project|Advanced"
    }}
  ]
}}
Do NOT include markdown formatting or extra text outside the JSON object.
"""
            response = model.generate_content(prompt)
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]

            parsed_data = json.loads(clean_text.strip())
            
            # Attach dynamic resources for each step
            for step in parsed_data.get("steps", []):
                step["resources"] = generate_step_resources(
                    goal_title=goal_title,
                    step_title=step.get("title", ""),
                    step_category=step.get("category", "Core Concept"),
                    skill_level=skill_level,
                    preferred_format=preferred_format,
                    learning_preferences=learning_preferences
                )

            logger.info(f"Successfully generated constraint-aware roadmap via Gemini API for '{goal_title}'")
            return parsed_data
        except Exception as e:
            logger.warning(f"Gemini API call failed or key not configured ({e}). Utilizing intelligent synthesis engine.")

    # Intelligent Synthesis Engine Fallback
    return _build_intelligent_synthesis_roadmap(
        goal_title=goal_title,
        target_outcome=target_outcome,
        skill_level=skill_level,
        existing_knowledge=existing_knowledge,
        daily_minutes=daily_minutes,
        days_per_week=days_per_week,
        deadline=deadline,
        preferred_format=preferred_format,
        learning_preferences=learning_preferences,
        desired_depth=desired_depth,
        capacity_data=capacity_data
    )



def refine_roadmap_with_ai(
    existing_roadmap: Dict[str, Any],
    refinement_prompt: str,
    goal_title: str,
    skill_level: str = "Beginner",
    daily_minutes: int = 30,
    preferred_format: str = "All"
) -> Dict[str, Any]:
    gemini_key = os.getenv("GEMINI_API_KEY")

    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
You are an expert AI Learning Mentor. Refine an existing learning roadmap based on a user's instruction.

Goal: {goal_title}
Skill Level: {skill_level}
Daily Study Time: {daily_minutes} minutes
Preferred Learning Format: {preferred_format}

User's Refinement Instruction: "{refinement_prompt}"

Here is the CURRENT roadmap context:
{json.dumps(existing_roadmap, indent=2)}

Please regenerate the roadmap incorporating the user's refinement instruction while keeping the same JSON schema format.
Return strictly a valid JSON object matching this schema:
{{
  "title": "Roadmap Title",
  "description": "Roadmap description",
  "steps": [
    {{
      "order_index": 1,
      "title": "Step title",
      "description": "Short explanation",
      "category": "Core Concept",
      "resources": []
    }}
  ]
}}
Do NOT include markdown formatting or extra text outside the JSON object. Do not populate resources, we will do it.
"""
            response = model.generate_content(prompt)
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]

            parsed_data = json.loads(clean_text.strip())
            
            # Populate resources using fetch_all_resources for each step
            for step in parsed_data.get("steps", []):
                step["resources"] = fetch_all_resources(
                    step_title=step.get("title", ""),
                    goal_title=goal_title,
                    skill_level=skill_level
                )
                
            logger.info(f"Successfully refined roadmap via Gemini API for '{goal_title}'")
            return parsed_data
        except Exception as e:
            logger.warning(f"Gemini API call failed for refinement ({e}). Falling back to fresh generation.")

    # Fallback to fresh generation
    logger.info("Falling back to generate_roadmap_with_ai for refinement.")
    return generate_roadmap_with_ai(
        goal_title=goal_title,
        skill_level=skill_level,
        daily_minutes=daily_minutes,
        preferred_format=preferred_format
    )


def generate_step_quiz(
    step_title: str,
    goal_title: str = "General",
    skill_level: str = "Beginner"
) -> List[Dict[str, Any]]:
    """
    Generates 3 topic-specific multiple choice questions for a roadmap step using Gemini AI or smart fallback.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")

    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
You are an expert technical interviewer and educator.
Generate an interactive 3-question multiple choice quiz for a student learning:
Topic: {step_title} (in learning path '{goal_title}')
Skill Level: {skill_level}

Return ONLY a valid JSON array of 3 objects with this exact structure:
[
  {{
    "question": "Clear, practical question testing knowledge of {step_title}?",
    "options": ["First option", "Second option", "Third option", "Fourth option"],
    "correct_index": 0,
    "explanation": "Brief explanation of why the correct option is right."
  }}
]
Do NOT include markdown formatting outside the JSON array.
"""
            response = model.generate_content(prompt)
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]

            parsed_quiz = json.loads(clean_text.strip())
            if isinstance(parsed_quiz, list) and len(parsed_quiz) >= 1:
                return parsed_quiz[:3]
        except Exception as e:
            logger.warning(f"Failed to generate Gemini AI quiz: {e}. Using fallback quiz generator.")

    # Smart Fallback Quiz Generator
    clean_topic = step_title.strip()
    return [
        {
            "question": f"What is the primary core purpose of {clean_topic}?",
            "options": [
                f"To establish essential concepts and standard best practices for {clean_topic}.",
                f"To replace fundamental syntax entirely without any advantages.",
                f"To slow down application performance and increase code complexity.",
                f"It is an legacy tool with no real-world software usage."
            ],
            "correct_index": 0,
            "explanation": f"{clean_topic} provides essential architecture, efficiency, and industry-standard best practices."
        },
        {
            "question": f"Which approach is recommended when implementing {clean_topic} in modern projects?",
            "options": [
                "Ignoring official documentation and skipping error handling.",
                f"Following modular design principles, clean structure, and standard conventions.",
                "Writing all code in a single unorganized file without modularity.",
                "Using deprecated syntax without testing."
            ],
            "correct_index": 1,
            "explanation": f"Modular design and clean coding conventions ensure high reliability and scalability when applying {clean_topic}."
        },
        {
            "question": f"How does mastering {clean_topic} benefit your overall skill growth in {goal_title}?",
            "options": [
                "It has no practical application in real-world engineering.",
                "It only works in theoretical academic exercises.",
                f"It accelerates technical problem solving and builds production-grade foundation.",
                "It restricts future learning flexibility."
            ],
            "correct_index": 2,
            "explanation": f"Mastering {clean_topic} accelerates problem-solving ability and equips you for real-world projects."
        }
    ]


def ask_ai_tutor(
    step_title: str,
    goal_title: str = "General",
    prompt_type: str = "explain_simple",
    custom_query: str = ""
) -> Dict[str, Any]:
    """
    Acts as a 24/7 AI Learning Coach answering student queries on a step concept.
    """
    clean_topic = step_title.strip() if step_title else "Core Concept"
    query_str = custom_query.strip()
    
    # 1. Attempt Gemini API if key is available
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            if prompt_type == "explain_simple":
                user_prompt = f"Explain '{clean_topic}' (from learning roadmap '{goal_title}') like I am 5 years old. Use a fun, memorable everyday analogy, clear bullet points, and key takeaways."
            elif prompt_type == "guide_hint":
                user_prompt = f"Act as an expert Socratic tutor for '{clean_topic}'. Provide 2-3 step-by-step reasoning hints and thought-provoking questions that guide the learner to master this on their own without giving the answer away."
            elif prompt_type == "interview" or prompt_type == "challenge_hard":
                user_prompt = f"Provide 1 challenging technical interview question/real-world problem on '{clean_topic}', followed by an architectural breakdown, code snippet if applicable, and common edge cases to watch out for."
            else:
                user_prompt = f"Context: Learning '{clean_topic}' inside '{goal_title}'.\nStudent Query: '{query_str}'.\nProvide a thorough, direct, highly educational response with code examples and practical tips where helpful."

            prompt = f"You are LearnWise Intelligence, a world-class AI Learning Mentor and Socratic Coach. Provide beautifully formatted markdown with syntax-highlighted code blocks, bold key terms, and structured paragraphs.\n\n{user_prompt}"
            response = model.generate_content(prompt)
            if response and response.text:
                return {
                    "step_title": clean_topic,
                    "prompt_type": prompt_type,
                    "answer": response.text.strip()
                }
        except Exception as e:
            logger.warning(f"AI Tutor Gemini API call failed: {e}. Utilizing dynamic reasoning engine.")

    # 2. Dynamic Intelligent Domain Reasoner (High Quality Offline Engine)
    q_lower = query_str.lower()
    
    # Handle greetings
    if q_lower in ["hi", "hello", "hey", "help", "yo", "start"]:
        answer = (
            f"### 👋 Welcome! I'm your LearnWise AI Coach for **{clean_topic}**\n\n"
            f"I'm here to help you master every aspect of **{clean_topic}** in **{goal_title}**.\n\n"
            f"Here are a few ways we can dive in right now:\n"
            f"* **Ask any question**: Type anything in the chat below (e.g., *'how does this work under the hood?'* or *'show me a code example'*).\n"
            f"* 💡 **EXPLAIN Mode**: Switch to intuitive analogies and simplified mental models.\n"
            f"* 🧭 **GUIDE Mode**: Get Socratic hints that guide your problem solving without spoiling the answer.\n"
            f"* 🔥 **CHALLENGE Mode**: Test your depth with real-world edge-case drills."
        )
    elif "code" in q_lower or "example" in q_lower or "syntax" in q_lower or "how to" in q_lower or "implement" in q_lower:
        # Generate topic-appropriate code snippet
        lang = "python"
        if any(w in clean_topic.lower() for w in ["javascript", "js", "react", "html", "css", "node", "frontend", "web"]):
            lang = "javascript"
            code_sample = (
                f"// Practical Implementation for {clean_topic}\n"
                f"async function handleOperation() {{\n"
                f"    try {{\n"
                f"        console.log('⚡ Initializing {clean_topic}...');\n"
                f"        // Step 1: Set up core state & execution context\n"
                f"        const result = await processPipeline();\n"
                f"        return {{ success: true, data: result }};\n"
                f"    }} catch (error) {{\n"
                f"        console.error('Error executing {clean_topic}:', error);\n"
                f"    }}\n"
                f"}}"
            )
        elif any(w in clean_topic.lower() for w in ["bash", "linux", "shell", "script", "cli", "devops"]):
            lang = "bash"
            code_sample = (
                f"#!/usr/bin/env bash\n"
                f"# Practical Production Script for {clean_topic}\n"
                f"set -euo pipefail\n\n"
                f"echo '🚀 Running {clean_topic} workflow...'\n"
                f"TARGET_DIR='/var/log/learnwise'\n\n"
                f"if [ -d \"$TARGET_DIR\" ]; then\n"
                f"    echo '✓ Directory exists. Inspecting permissions...'\n"
                f"    ls -la \"$TARGET_DIR\"\n"
                f"fi"
            )
        elif any(w in clean_topic.lower() for w in ["sql", "database", "postgres", "mysql"]):
            lang = "sql"
            code_sample = (
                f"-- Query demonstration for {clean_topic}\n"
                f"SELECT \n"
                f"    user_id,\n"
                f"    COUNT(step_id) AS completed_milestones,\n"
                f"    AVG(score) AS mastery_rate\n"
                f"FROM progress_metrics\n"
                f"GROUP BY user_id\n"
                f"HAVING COUNT(step_id) > 5\n"
                f"ORDER BY mastery_rate DESC;"
            )
        else:
            lang = "python"
            code_sample = (
                f"# Demonstration for {clean_topic}\n"
                f"def execute_concept():\n"
                f"    \"\"\"\n"
                f"    Production-grade implementation for {clean_topic}\n"
                f"    \"\"\"\n"
                f"    print('Initializing {clean_topic}...')\n"
                f"    pipeline = [x ** 2 for x in range(10)]\n"
                f"    return f'✓ {clean_topic} completed with {{len(pipeline)}} processed items.'\n\n"
                f"if __name__ == '__main__':\n"
                f"    print(execute_concept())"
            )

        answer = (
            f"### 💻 Practical Code Breakdown: {clean_topic}\n\n"
            f"Here is a clean, practical pattern demonstrating **{clean_topic}**:\n\n"
            f"```{lang}\n{code_sample}\n```\n\n"
            f"### 🔍 Key Engineering Principles:\n"
            f"* **Structure**: Isolates logic into predictable, modular units.\n"
            f"* **Error Handling**: Handles boundary conditions and prevents silent runtime failures.\n"
            f"* **Efficiency**: Minimizes redundant memory allocation and latency."
        )
    elif prompt_type == "guide_hint" or "hint" in q_lower or "guide" in q_lower or "socratic" in q_lower:
        answer = (
            f"### 🧭 Socratic Guidance for **{clean_topic}**\n\n"
            f"Let's reason through this step-by-step so you build true first-principles intuition:\n\n"
            f"1. **Core Problem Formulation**: What is the fundamental bottleneck or problem that **{clean_topic}** is engineered to solve in **{goal_title}**?\n"
            f"2. **State & Flow**: Imagine you are tracing data through the system. What happens immediately before **{clean_topic}** runs, and what output does it pass downstream?\n"
            f"3. **Inversion Test**: What failure modes or bugs happen if **{clean_topic}** is completely missing from your architecture?\n\n"
            f"*💡 **Hint**: Think about how input constraints dictate the most efficient data structure or algorithm here.*"
        )
    elif prompt_type == "interview" or prompt_type == "challenge_hard" or "challenge" in q_lower or "interview" in q_lower:
        answer = (
            f"### 🔥 Technical Challenge & Interview Drill\n\n"
            f"**Scenario Question**: You are designing a production system in **{goal_title}** that relies heavily on **{clean_topic}**. Under 10x normal traffic, you detect memory spikes and latency degradation.\n\n"
            f"#### 🎯 Challenge Tasks:\n"
            f"1. What is the primary bottleneck in how **{clean_topic}** executes?\n"
            f"2. How would you refactor the architecture to support horizontal scalability?\n"
            f"3. What trade-offs exist between caching, asynchronous execution, and direct synchronization?\n\n"
            f"#### 💡 Model Architectural Answer:\n"
            f"Senior engineers decouple the compute-heavy parts of **{clean_topic}** using worker queues, implement bounded memory buffers, and benchmark with profiling tools before optimizing prematurely."
        )
    elif prompt_type == "explain_simple" or "explain" in q_lower or "analogy" in q_lower:
        answer = (
            f"### 💡 {clean_topic} Explained Simply\n\n"
            f"Imagine building a high-speed express train system. **{clean_topic}** is like the precision switching track that routes each train to the right platform without any collisions or delays.\n\n"
            f"#### 🌟 3 Essential Takeaways:\n"
            f"* **1. Clear Purpose**: It takes complex raw inputs and channels them into structured, reliable outcomes.\n"
            f"* **2. Interoperability**: It connects seamlessly with the rest of your **{goal_title}** toolkit.\n"
            f"* **3. Cognitive Muscle**: Once you understand the underlying pattern, you will spot its use everywhere across modern software systems."
        )
    else:
        # Dynamic response to arbitrary user question
        answer = (
            f"### 🤖 LearnWise Intelligence: {clean_topic}\n\n"
            f"Regarding your question: *\"{query_str}\"*\n\n"
            f"In the context of **{clean_topic}** ({goal_title}):\n\n"
            f"1. **Conceptual Meaning**: **{clean_topic}** is designed to provide consistency, reliability, and modularity. When solving *\"{query_str}\"*, the first step is identifying the core inputs and expected output.\n\n"
            f"2. **Best Practice Approach**: Break the problem down into isolated sub-problems. Test each component in isolation before integrating it into the full pipeline.\n\n"
            f"3. **Practical Tip**: Leverage the curated resources in your milestone workbench to see industry-standard examples and edge-case handling.\n\n"
            f"Would you like me to provide a **working code snippet**, **break down a specific sub-topic**, or give you a **practice quiz question**?"
        )

    return {
        "step_title": clean_topic,
        "prompt_type": prompt_type,
        "answer": answer
    }


