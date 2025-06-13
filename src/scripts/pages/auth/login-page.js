// login-page.js
import { login } from '../../data/api';
import CONFIG from '../../config';

export default class LoginPage {
  async render() {
    return `
      <section class="auth-section">
        <div class="auth-card">
          <div class="auth-header">
            <i class="fas fa-sign-in-alt auth-icon"></i>
            <h1>Welcome Back</h1>
            <p>Login to continue your journey</p>
          </div>
          
          <form id="loginForm" class="auth-form">
            <div class="form-group">
              <div class="input-group">
                <i class="fas fa-envelope input-icon"></i>
                <input type="email" id="email" name="email" placeholder="Your Email" required>
              </div>
            </div>
            
            <div class="form-group">
              <div class="input-group">
                <i class="fas fa-lock input-icon"></i>
                <input type="password" id="password" name="password" placeholder="Your Password" required>
                <button type="button" class="toggle-password" aria-label="Toggle password visibility">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            
            <button type="submit" class="auth-submit-btn">
              <span class="btn-text">Login</span>
              <i class="fas fa-arrow-right btn-icon"></i>
            </button>
            
            <div class="auth-footer">
              <p>Don't have an account? <a href="#/register" class="auth-link">Register here</a></p>
              <a href="#/forgot-password" class="forgot-password">Forgot password?</a>
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

    // Form submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.querySelector('.auth-submit-btn');
      const originalText = submitBtn.innerHTML;
      
      try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const response = await login({ email, password });
        
        localStorage.setItem(CONFIG.USER_TOKEN_KEY, response.loginResult.token);
        
        // Show success message
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
        setTimeout(() => {
          window.location.hash = '#/stories';
        }, 1000);
        
      } catch (error) {
        console.error('Login error:', error);
        submitBtn.innerHTML = originalText;
        this._showError(error.message || 'Login failed. Please try again.');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  _showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'auth-error';
    errorElement.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    `;
    
    const form = document.getElementById('loginForm');
    form.insertBefore(errorElement, form.firstChild);
    
    setTimeout(() => {
      errorElement.classList.add('fade-out');
      setTimeout(() => errorElement.remove(), 300);
    }, 5000);
  }
}