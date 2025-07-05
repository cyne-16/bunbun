// public/js/script.js
$(document).ready(function () {
  const token = localStorage.getItem("bunbun_token");

  if (token) {
  $("#nav-icons").html(`
    <a href="index.html"><i class="fas fa-home"></i></a>
    <a href="shop.html"><i class="fas fa-shopping-cart"></i></a>
    <a href="profile.html"><i class="fas fa-user"></i></a>
    <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i></a>
  `);
} else {
  $("#nav-icons").html(`
    <a href="login.html"><i class="fas fa-sign-in-alt"></i></a>
    <a href="signup.html"><i class="fas fa-user-plus"></i></a>
  `);
}

// Load NEW ARRIVALS (category_id = 4)
fetch('/api/products/new')
  .then(res => res.json())
  .then(data => {
    const container = $('#new-grid');
    container.empty();

    if (!data.length) {
      container.append('<p>No new arrivals found.</p>');
      return;
    }

    data.forEach(product => {
      const card = `
        <div class="product-card">
          <img src="${product.image_url || 'images/default.jpg'}" alt="${product.name}">
          <h4>${product.name}</h4>
          <p>${product.description}</p>
          <p><strong>₱${product.price}</strong></p>
        </div>
      `;
      container.append(card);
    });

    updateIndicators('new');
  })
  .catch(err => {
    console.error('New arrivals fetch error:', err);
    $('#new-grid').html('<p>Error loading new arrivals.</p>');
  });

// Load POPULAR ITEMS (category_id = 5)
fetch('/api/products/popular')
  .then(res => res.json())
  .then(data => {
    const container = $('#popular-grid');
    container.empty();

    if (!data.length) {
      container.append('<p>No popular items found.</p>');
      return;
    }

    data.forEach(product => {
      const card = `
        <div class="product-card">
          <img src="${product.image_url || 'images/default.jpg'}" alt="${product.name}">
          <h4>${product.name}</h4>
          <p>${product.description}</p>
          <p><strong>₱${product.price}</strong></p>
        </div>
      `;
      container.append(card);
    });

    updateIndicators('popular');
  })
  .catch(err => {
    console.error('Popular items fetch error:', err);
    $('#popular-grid').html('<p>Error loading popular items.</p>');
  });




  // Handle login (demo only — you should use modals or forms)
  $("#loginBtn").on("click", function () {
    const email = prompt("Email:");
    const password = prompt("Password:");

    $.post("/api/auth/login", { email, password })
      .done(function (data) {
        localStorage.setItem("bunbun_token", data.token);
        alert("Welcome " + data.user.fname + "!");
        location.reload();
      })
      .fail(function () {
        alert("Invalid credentials");
      });
  });

  $("#logoutBtn").on("click", function () {
    localStorage.removeItem("bunbun_token");
    location.reload();
  });
});

 let currentSlide = {
      new: 0,
      popular: 0
    };

    function slideProducts(section, direction) {
      const grid = document.getElementById(`${section}-grid`);
      const cards = grid.querySelectorAll('.product-card');
      const cardWidth = cards[0].offsetWidth + 32; // card width + gap
      const maxScroll = grid.scrollWidth - grid.clientWidth;
      
      if (direction === 'next') {
        if (grid.scrollLeft < maxScroll) {
          grid.scrollLeft += cardWidth;
          currentSlide[section]++;
        }
      } else {
        if (grid.scrollLeft > 0) {
          grid.scrollLeft -= cardWidth;
          currentSlide[section]--;
        }
      }
      
      updateIndicators(section);
    }

    function updateIndicators(section) {
      const indicators = document.getElementById(`${section}-indicators`);
      const grid = document.getElementById(`${section}-grid`);
      const cards = grid.querySelectorAll('.product-card');
      const visibleCards = Math.floor(grid.clientWidth / (cards[0].offsetWidth + 32));
      const totalSlides = Math.max(1, cards.length - visibleCards + 1);
      
      // Clear existing indicators
      indicators.innerHTML = '';
      
      // Create new indicators
      for (let i = 0; i < totalSlides; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'indicator';
        if (i === currentSlide[section]) {
          indicator.classList.add('active');
        }
        indicator.onclick = () => goToSlide(section, i);
        indicators.appendChild(indicator);
      }
    }

    function goToSlide(section, slideIndex) {
      const grid = document.getElementById(`${section}-grid`);
      const cards = grid.querySelectorAll('.product-card');
      const cardWidth = cards[0].offsetWidth + 32;
      
      grid.scrollLeft = slideIndex * cardWidth;
      currentSlide[section] = slideIndex;
      updateIndicators(section);
    }

    // Smooth scrolling for category buttons
    function scrollToProducts(category) {
      const productsSection = document.getElementById('new-products');
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Initialize sliders and add interactive effects
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize indicators
      updateIndicators('new');
      updateIndicators('popular');
      
      // Update indicators on window resize
      window.addEventListener('resize', function() {
        updateIndicators('new');
        updateIndicators('popular');
      });

      // Animate product cards on scroll
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
          }
        });
      }, observerOptions);

      // Observe all product cards
      document.querySelectorAll('.product-card').forEach(card => {
        observer.observe(card);
      });

      // Add click effects to buttons
      document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
          this.style.transform = 'scale(0.95)';
          setTimeout(() => {
            this.style.transform = 'scale(1)';
          }, 100);
        });
      });

      // Add swipe functionality for mobile
      let startX = 0;
      let scrollLeft = 0;
      
      document.querySelectorAll('.products-grid').forEach(grid => {
        grid.addEventListener('touchstart', function(e) {
          startX = e.touches[0].pageX - grid.offsetLeft;
          scrollLeft = grid.scrollLeft;
        });
        
        grid.addEventListener('touchmove', function(e) {
          e.preventDefault();
          const x = e.touches[0].pageX - grid.offsetLeft;
          const walk = (x - startX) * 2;
          grid.scrollLeft = scrollLeft - walk;
        });
      });
    });

    // Animate elements when they come into view
const animateOnScroll = () => {
  const elements = document.querySelectorAll('.fade-in, .slide-up, .slide-left, .slide-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
};

document.addEventListener('DOMContentLoaded', animateOnScroll);

    
