export default class NotFoundPage {
  async render() {
    return `
      <section class="not-found-container">
        <div class="not-found-content">
          <h1 class="not-found-title">404</h1>
          <p class="not-found-subtitle">Oops! Halaman tidak ditemukan</p>
          <a href="#/" class="not-found-home-btn">
            <i class="fas fa-home"></i> Kembali ke Beranda
          </a>
        </div>
      </section>
    `;
  }

  async afterRender() {}
}
