import './Navbar.css';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className="logo">
                    <h2>Learn<span>Wise</span></h2>
                </div>

                <div className="nav-links">
                    <a href="#">Home</a>
                    <a href="#features">Features</a>
                    <a href="#how-it-works">How It Works</a>
                    <a href="#">About</a>
                </div>

                <div className="nav-actions">
                    <button className="btn btn-primary">Get Started</button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;