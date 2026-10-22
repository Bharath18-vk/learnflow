import React from "react";
import { Link } from "react-router-dom";

function NotFoundPage() {
    return (
        <div style={{ padding: "40px", textAlign: "center" }}>
            <h1>404 - Page Not Found</h1>
            <p>The page you are looking for does not exist.</p>
            <Link to="/" style={{ color: "#0066cc", textDecoration: "underline" }}>Go back to Home</Link>
        </div>
    );
}

export default NotFoundPage;
