export default class HomePage {
  async render() {
    return `
      <section class="container home-container">
        <div class="hero-section">
          <h1 class="hero-title">Share Your Journey</h1>
          <p class="hero-subtitle">Discover and share stories from around the world</p>
          <a href="#/stories" class="cta-button">Explore Stories</a>
        </div>

        <div class="features-section">
          <h2>Why Choose Our Platform</h2>
          <div class="features-grid">
            <div class="feature-card">
              <i class="fas fa-globe feature-icon"></i>
              <h3>Global Stories</h3>
              <p>Read and share experiences from people worldwide</p>
            </div>
            <div class="feature-card">
              <i class="fas fa-map-marked-alt feature-icon"></i>
              <h3>Interactive Map</h3>
              <p>See stories pinned on a beautiful interactive map</p>
            </div>
            <div class="feature-card">
              <i class="fas fa-camera feature-icon"></i>
              <h3>Rich Media</h3>
              <p>Enhance your stories with photos and locations</p>
            </div>
          </div>
        </div>

        <div class="quick-start">
          <h2>Get Started in Seconds</h2>
          <div class="steps">
            <div class="step">
              <span class="step-number">1</span>
              <p>Create an account or login</p>
            </div>
            <div class="step">
              <span class="step-number">2</span>
              <p>Click "Add Story" to share your experience</p>
            </div>
            <div class="step">
              <span class="step-number">3</span>
              <p>Explore stories from our community</p>
            </div>
          </div>
          <div class="action-buttons">
            <a href="#/register" class="primary-button">Register Now</a>
            <a href="#/stories" class="secondary-button">Browse Stories</a>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Animation for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
    });
  }
}