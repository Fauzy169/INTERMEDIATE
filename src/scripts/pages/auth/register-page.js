import { register } from '../../data/api';

export default class RegisterPage {
  async render() {
    return `
      <section class="auth-section">
        <div class="auth-card">
          <div class="auth-header">
            <i class="fas fa-user-plus auth-icon"></i>
            <h1>Create Account</h1>
            <p>Join our community today</p>
          </div>
          
          <form id="registerForm" class="auth-form">
            <div class="form-group">
              <div class="input-group">
                <i class="fas fa-user input-icon"></i>
                <input type="text" id="name" name="name" placeholder="Your Name" required>
              </div>
            </div>
            
            <div class="form-group">
              <div class="input-group">
                <i class="fas fa-envelope input-icon"></i>
                <input type="email" id="email" name="email" placeholder="Your Email" required>
              </div>
            </div>
            
            <div class="form-group">
              <div class="input-group">
                <i class="fas fa-lock input-icon"></i>
                <input type="password" id="password" name="password" placeholder="Create Password" required>
                <button type="button" class="toggle-password" aria-label="Toggle password visibility">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <div class="password-strength">
                <div class="strength-bar"></div>
                <div class="strength-bar"></div>
                <div class="strength-bar"></div>
              </div>
            </div>
            
            <button type="submit" class="auth-submit-btn">
              <span class="btn-text">Register</span>
              <i class="fas fa-arrow-right btn-icon"></i>
            </button>
            
            <div class="auth-footer">
              <p>Already have an account? <a href="#/login" class="auth-link">Login here</a></p>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Toggle password visibility
    document.querySelector('.toggle-password').addEventListener('click', (e) => {
      const passwordInput = document.getElementById('password');
      const icon = e.currentTarget.querySelector('i');
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      icon.classList.toggle('fa-eye');
      icon.classList.toggle('fa-eye-slash');
    });

    // Password strength indicator
    document.getElementById('password').addEventListener('input', (e) => {
      this._updatePasswordStrength(e.target.value);
    });

    // Form submission
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.querySelector('.auth-submit-btn');
      const originalText = submitBtn.innerHTML;
      
      try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        await register({ name, email, password });
        
        // Show success message
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 1000);
        
      } catch (error) {
        console.error('Registration error:', error);
        submitBtn.innerHTML = originalText;
        this._showError(error.message || 'Registration failed. Please try again.');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  _updatePasswordStrength(password) {
    const strengthBars = document.querySelectorAll('.strength-bar');
    const strength = this._calculatePasswordStrength(password);
    
    strengthBars.forEach((bar, index) => {
      bar.style.backgroundColor = index < strength ? this._getStrengthColor(strength) : '#e2e8f0';
    });
  }

  _calculatePasswordStrength(password) {
    if (!password) return 0;
    if (password.length < 6) return 1;
    
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    
    let strength = 1;
    if (password.length >= 8) strength++;
    if (hasLetters && hasNumbers) strength++;
    if (hasSpecial) strength++;
    
    return Math.min(strength, 3);
  }

  _getStrengthColor(strength) {
    const colors = ['#ef4444', '#f59e0b', '#10b981'];
    return colors[strength - 1];
  }

  _showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'auth-error';
    errorElement.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    `;
    
    const form = document.getElementById('registerForm');
    form.insertBefore(errorElement, form.firstChild);
    
    setTimeout(() => {
      errorElement.classList.add('fade-out');
      setTimeout(() => errorElement.remove(), 300);
    }, 5000);
  }
}