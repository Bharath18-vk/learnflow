import "./HowItWorks.css";

const steps = [
    {
        id: 1,
        icon: "🎯",
        title: "Choose Your Goal",
        description:
            "Tell LearnWise what you want to learn, your current level, and how much time you can study.",
    },
    {
        id: 2,
        icon: "🤖",
        title: "AI Creates Your Roadmap",
        description:
            "Our AI builds a personalized roadmap with carefully selected learning resources.",
    },
    {
        id: 3,
        icon: "🚀",
        title: "Learn & Track Progress",
        description:
            "Follow your roadmap, complete milestones, and monitor your learning journey.",
    },
];

function HowItWorks() {
    return (
        <section id="how-it-works" className="how-it-works-section">
            <div className="how-it-works-container">
                <div className="section-header">
                    <h2 className="section-title">How LearnWise <span>Works</span></h2>
                    <p className="section-subtitle">
                        Learning becomes simple with our three-step process.
                    </p>
                </div>

                <div className="steps-grid">
                    {steps.map((step) => (
                        <div className="step-card" key={step.id}>
                            <div className="step-icon">{step.icon}</div>
                            <h3 className="step-title">{step.title}</h3>
                            <p className="step-description">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default HowItWorks;