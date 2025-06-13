export default class AboutPage {
  async render() {
    return `
      <section class="about-page">
        <!-- Hero Section -->
        <div class="about-hero">
          <div class="about-hero-content">
            <h1>About <span class="highlight">StoryShare</span></h1>
            <p class="hero-subtitle">Connecting the world through shared experiences</p>
          </div>
          <div class="about-hero-image">
            <img src="./images/about-hero.svg" alt="Team working together" loading="lazy">
          </div>
        </div>

        <!-- Mission Section -->
        <div class="mission-section">
          <div class="section-header">
            <h2>Our <span class="highlight">Mission</span></h2>
          </div>
          
          <div class="mission-content">
            <div class="mission-text">
              <p>
                At StoryShare, we believe that every journey has a story worth telling. 
                Our platform was born from a passion for travel, connection, and the 
                power of shared experiences.
              </p>
              <p>
                We're committed to creating a space where people from all walks of life 
                can document their adventures, discover new perspectives, and connect 
                through the universal language of storytelling.
              </p>
            </div>
            <div class="mission-image">
              <img src="./images/mission-image.jpg" alt="People connecting around a world map" loading="lazy">
            </div>
          </div>
        </div>

        <!-- Features Section -->
        <div class="about-features">
          <div class="section-header">
            <h2>Key <span class="highlight">Features</span></h2>
          </div>
          
          <div class="feature-highlights">
            <div class="feature-highlight">
              <div class="feature-icon">
                <i class="fas fa-map-marked-alt"></i>
              </div>
              <div class="feature-details">
                <h3>Interactive Story Map</h3>
                <p>
                  Our dynamic world map lets you explore stories geographically. 
                  Zoom in on locations that interest you and discover personal 
                  experiences from those places.
                </p>
              </div>
            </div>
            
            <div class="feature-highlight">
              <div class="feature-icon">
                <i class="fas fa-camera-retro"></i>
              </div>
              <div class="feature-details">
                <h3>Rich Media Support</h3>
                <p>
                  Enhance your stories with high-quality images. Our platform 
                  supports direct uploads from your device or camera for 
                  authentic storytelling.
                </p>
              </div>
            </div>
            
            <div class="feature-highlight">
              <div class="feature-icon">
                <i class="fas fa-mobile-alt"></i>
              </div>
              <div class="feature-details">
                <h3>Mobile-First Design</h3>
                <p>
                  Share your stories on the go with our fully responsive design. 
                  The experience is seamless whether you're on desktop, tablet, 
                  or smartphone.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Technology Stack -->
        <div class="tech-stack-section">
          <div class="section-header">
            <h2>Our <span class="highlight">Technology</span></h2>
            <p class="section-subtitle">Built with modern web technologies</p>
          </div>
          
          <div class="tech-grid">
            <div class="tech-card" tabindex="0">
              <div class="tech-icon">
                <i class="fab fa-js"></i>
              </div>
              <h3>JavaScript ES6+</h3>
              <p>Modern JavaScript for interactive features and smooth performance</p>
            </div>
            
            <div class="tech-card" tabindex="0">
              <div class="tech-icon">
                <i class="fas fa-map"></i>
              </div>
              <h3>Leaflet.js</h3>
              <p>Lightweight mapping library for interactive story locations</p>
            </div>
            
            <div class="tech-card" tabindex="0">
              <div class="tech-icon">
                <i class="fas fa-server"></i>
              </div>
              <h3>Dicoding API</h3>
              <p>Robust backend service for story management and user data</p>
            </div>
            
            <div class="tech-card" tabindex="0">
              <div class="tech-icon">
                <i class="fab fa-css3-alt"></i>
              </div>
              <h3>CSS3 Animations</h3>
              <p>Beautiful transitions and visual feedback for enhanced UX</p>
            </div>
          </div>
        </div>

        <!-- Team Section -->
        <div class="team-section">
          <div class="section-header">
            <h2>Development <span class="highlight">Team</span></h2>
          </div>
          
          <div class="team-members">
            <div class="team-card">
              <div class="team-photo">
                <img src="./images/developer.jpg" alt="Project Developer" loading="lazy">
              </div>
              <div class="team-info">
                <h3>Dicoding Student</h3>
                <p class="role">Front-End Developer</p>
                <p class="bio">
                  This project was developed as part of the Dicoding Front-End Web 
                  Development Expert certification program, demonstrating mastery 
                  of modern web technologies and best practices.
                </p>
                <div class="social-links">
                  <a href="#" aria-label="GitHub profile"><i class="fab fa-github"></i></a>
                  <a href="#" aria-label="LinkedIn profile"><i class="fab fa-linkedin"></i></a>
                  <a href="#" aria-label="Portfolio website"><i class="fas fa-globe"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Animate sections on load
    const sections = document.querySelectorAll('.about-hero, .mission-section, .about-features, .tech-stack-section, .team-section');
    
    sections.forEach((section, index) => {
      section.animate(
        [
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 600,
          delay: index * 100,
          easing: 'ease-out',
          fill: 'forwards'
        }
      );
    });

    // Animate tech cards on hover
    const techCards = document.querySelectorAll('.tech-card');
    techCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' }
          ],
          {
            duration: 200,
            easing: 'ease-out',
            fill: 'forwards'
          }
        );
      });

      card.addEventListener('mouseleave', () => {
        card.animate(
          [
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
          ],
          {
            duration: 200,
            easing: 'ease-out',
            fill: 'forwards'
          }
        );
      });
    });
  }
}