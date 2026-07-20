import "./Features.css";

const features = [
    {
        id: 1,
        icon: "🤖",
        title: "AI-Powered Roadmaps",
        description:
            "Generate personalized learning roadmaps based on your goals, experience, and available study time.",
    },
    {
        id: 2,
        icon: "📚",
        title: "Curated Resources",
        description:
            "Get the best learning resources for each topic without wasting hours searching the internet.",
    },
    {
        id: 3,
        icon: "📈",
        title: "Progress Tracking",
        description:
            "Track your learning journey, monitor completed topics, and stay motivated with visual progress.",
    },
    {
        id: 4,
        icon: "🎯",
        title: "Stay Focused",
        description:
            "Avoid tutorial hopping by following one structured roadmap from start to finish.",
    },
];

function Features() {
    return (
        <section id="features" className="features-section">
            <div className="features-container">
                <div className="section-header">
                    <h2 className="section-title">Why Choose <span>LearnWise</span>?</h2>
                    <p className="section-subtitle">
                        LearnWise helps you learn efficiently with AI-powered guidance,
                        curated resources, and structured learning paths.
                    </p>
                </div>

                <div className="features-grid">
                    {features.map((feature) => (
                        <div className="feature-card" key={feature.id}>
                            <div className="feature-icon">{feature.icon}</div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Features;