import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Users, Camera, TrendingUp, Award, Clock } from "lucide-react";
import "../LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = payload.role;

        if (role === "stall_owner") {
          navigate("/dashboard");
        } else if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [navigate]);

  const features = [
    {
      icon: <Store size={32} />,
      title: "Discover Local Hawkers",
      description: "Explore authentic hawker stalls across Singapore",
    },
    {
      icon: <Camera size={32} />,
      title: "Share Your Experience",
      description:
        "Upload photos and reviews to help others discover great food",
    },
    {
      icon: <TrendingUp size={32} />,
      title: "Trending Photos",
      description: "Popular photos can become official menu images",
    },
    {
      icon: <Award size={32} />,
      title: "Earn Rewards",
      description:
        "Get coins for your contributions and redeem exclusive perks",
    },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-page__hero-section">
        <div className="landing-page__hero-content">
          <div className="landing-page__hero-badge">
            <Clock size={16} />
            <span>Serving authentic hawker food since day one</span>
          </div>

          <h1 className="landing-page__hero-title">
            Discover Singapore's Best
            <span className="landing-page__hero-title-highlight">
              {" "}
              Hawker Food
            </span>
          </h1>

          <p className="landing-page__hero-description">
            Order from your favorite hawker stalls, share your foodie moments,
            and earn rewards for your contributions to the community.
          </p>

          <div className="landing-page__hero-actions">
            <button
              className="landing-page__btn landing-page__btn-primary"
              onClick={() => navigate("/register")}
            >
              Get Started
            </button>
            <button
              className="landing-page__btn landing-page__btn-secondary"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
          </div>

          <div className="landing-page__hero-stats">
            <div className="landing-page__stat-item">
              <div className="landing-page__stat-number">858+</div>
              <div className="landing-page__stat-label">Hawker Stalls</div>
            </div>
            <div className="landing-page__stat-divider" />
            <div className="landing-page__stat-item">
              <div className="landing-page__stat-number">10K+</div>
              <div className="landing-page__stat-label">Food Photos</div>
            </div>
            <div className="landing-page__stat-divider" />
            <div className="landing-page__stat-item">
              <div className="landing-page__stat-number">5K+</div>
              <div className="landing-page__stat-label">Happy Users</div>
            </div>
          </div>
        </div>

        <div className="landing-page__hero-image">
          <div className="landing-page__floating-card landing-page__card-1">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop"
              alt="Delicious hawker food"
            />
            <div className="landing-page__card-overlay">
              <Star size={16} fill="#ffc107" stroke="#ffc107" />
              <span>4.8</span>
            </div>
          </div>

          <div className="landing-page__floating-card landing-page__card-2">
            <img
              src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop"
              alt="Amazing local dish"
            />
            <div className="landing-page__card-overlay">
              <Users size={16} />
              <span>2.3K Reviews</span>
            </div>
          </div>

          <div className="landing-page__floating-card landing-page__card-3">
            <img
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop"
              alt="Popular hawker meal"
            />
            <div className="landing-page__card-overlay">
              <TrendingUp size={16} />
              <span>Trending</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-page__features-section">
        <div className="landing-page__section-header">
          <h2 className="landing-page__section-title">Why Choose Us?</h2>
          <p className="landing-page__section-subtitle">
            Join our community of food lovers and discover the best hawker
            experiences
          </p>
        </div>

        <div className="landing-page__features-grid">
          {features.map((feature, index) => (
            <div key={index} className="landing-page__feature-card">
              <div className="landing-page__feature-icon">{feature.icon}</div>
              <h3 className="landing-page__feature-title">{feature.title}</h3>
              <p className="landing-page__feature-description">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-page__cta-section">
        <div className="landing-page__cta-content">
          <h2 className="landing-page__cta-title">
            Ready to Start Your Food Journey?
          </h2>
          <p className="landing-page__cta-description">
            Join thousands of food lovers discovering the best hawker food in
            Singapore
          </p>
          <button
            className="landing-page__btn landing-page__btn-primary"
            onClick={() => navigate("/register")}
          >
            Create Your Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-page__footer">
        <p>© 2025 Hawker Food Delivery. Made with ❤️ in Singapore</p>
      </footer>
    </div>
  );
}

const Star = ({ size, fill, stroke }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
