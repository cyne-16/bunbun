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

    // Enhanced product card creation function
    function createProductCard(product) {
        return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-image-container">
          <img src="${product.image_url || 'images/default.jpg'}" 
               alt="${product.name}" 
               class="product-image"
               onerror="this.src='images/default.jpg'">
          <div class="product-overlay">
            <button class="quick-view-btn" data-product-id="${product.id}">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
        <div class="product-info">
          <h4 class="product-name">${product.name}</h4>
          <p class="product-description">${truncateText(product.description, 60)}</p>
          <div class="product-price">₱${parseFloat(product.price).toFixed(2)}</div>
          <button class="add-to-cart-btn" data-product-id="${product.id}">
            <i class="fas fa-shopping-cart"></i>
            Add to Cart
          </button>
          <br>
          <a href="product-details.html?id=${product.id}" class="view-more-btn">
            <i class="fas fa-info-circle"></i> View More
          </a>
        </div>
      </div>
    `;
    }


    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }


    fetch('/api/products/new')
        .then(res => res.json())
        .then(data => {
            console.log('NEW PRODUCTS:', data); // ✅ ADD THIS
            const container = $('#new-grid');
            container.empty();

            if (!data.length) {
                container.append('<div class="no-products"><p>No new arrivals found.</p></div>');
                return;
            }

            data.forEach(product => {
                container.append(createProductCard(product));
            });

            updateIndicators('new');
            attachProductEventListeners();
        })
        .catch(err => {
            console.error('New arrivals fetch error:', err);
            $('#new-grid').html('<div class="error-message"><p>Error loading new arrivals.</p></div>');
        });


    fetch('/api/products/popular')
        .then(res => res.json())
        .then(data => {
            const container = $('#popular-grid');
            container.empty();

            if (!data.length) {
                container.append('<div class="no-products"><p>No popular items found.</p></div>');
                return;
            }

            data.forEach(product => {
                container.append(createProductCard(product));
            });

            updateIndicators('popular');
            attachProductEventListeners();
        })
        .catch(err => {
            console.error('Popular items fetch error:', err);
            $('#popular-grid').html('<div class="error-message"><p>Error loading popular items.</p></div>');
        });

    // Attach event listeners to product cards
    function attachProductEventListeners() {
        // Add to cart functionality
        $('.add-to-cart-btn').off('click').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const productId = $(this).data('product-id');
            const button = $(this);

            // Add loading state
            button.addClass('loading').prop('disabled', true);
            button.html('<i class="fas fa-spinner fa-spin"></i> Adding...');

            addToCart(productId, button);
        });

        // Quick view functionality
        $('.quick-view-btn').off('click').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const productId = $(this).data('product-id');
            showProductModal(productId);
        });


        $('.product-card').off('mouseenter mouseleave').on({
            mouseenter: function () {
                $(this).addClass('hovered');
            },
            mouseleave: function () {
                $(this).removeClass('hovered');
            }
        });
    }


    function addToCart(productId, button) {
        const token = localStorage.getItem("bunbun_token");

        if (!token) {
            showNotification('Please login to add items to cart', 'warning');
            button.removeClass('loading').prop('disabled', false);
            button.html('<i class="fas fa-shopping-cart"></i> Add to Cart');
            return;
        }

        $.ajax({
            url: '/api/cart/add',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                product_id: productId,
                quantity: 1
            }),
            success: function (response) {
                button.removeClass('loading').addClass('success').prop('disabled', false);
                button.html('<i class="fas fa-check"></i> Added!');

                // Reset button after 2 seconds
                setTimeout(() => {
                    button.removeClass('success');
                    button.html('<i class="fas fa-shopping-cart"></i> Add to Cart');
                }, 2000);

                showNotification('Item added to cart successfully!', 'success');
                updateCartCount();
            },
            error: function (xhr) {
                button.removeClass('loading').prop('disabled', false);
                button.html('<i class="fas fa-shopping-cart"></i> Add to Cart');

                const errorMsg = xhr.responseJSON?.message || 'Failed to add item to cart';
                showNotification(errorMsg, 'error');
            }
        });
    }

    // Show notification function
    function showNotification(message, type = 'info') {
        const notification = $(`
      <div class="notification ${type}">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="close-notification">&times;</button>
      </div>
    `);

        $('body').append(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.fadeOut(300, () => notification.remove());
        }, 5000);

        // Manual close
        notification.find('.close-notification').on('click', function () {
            notification.fadeOut(300, () => notification.remove());
        });
    }

    // Update cart count in navigation
    function updateCartCount() {
        const token = localStorage.getItem("bunbun_token");
        if (!token) return;

        $.ajax({
            url: '/api/cart/count',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (response) {
                const count = response.count || 0;
                let cartIcon = $('a[href="shop.html"] i');

                // Remove existing badge
                cartIcon.siblings('.cart-badge').remove();

                // Add new badge if count > 0
                if (count > 0) {
                    cartIcon.after(`<span class="cart-badge">${count}</span>`);
                }
            }
        });
    }


    function showProductModal(productId) {

        $.ajax({
            url: `/api/products/details/${productId}`,
            method: 'GET',
            success: function (product) {
                const modal = $(`
          <div class="product-modal-overlay">
            <div class="product-modal">
              <button class="close-modal">&times;</button>
              <div class="modal-content">
                <div class="modal-image">
                  <img src="${product.image_url || 'images/default.jpg'}" alt="${product.name}">
                </div>
                <div class="modal-info">
                  <h2>${product.name}</h2>
                  <p class="modal-description">${product.description}</p>
                  <div class="modal-price">₱${parseFloat(product.price).toFixed(2)}</div>
                  <button class="modal-add-to-cart" data-product-id="${product.id}">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        `);

                $('body').append(modal);

                // Close modal events
                modal.find('.close-modal, .product-modal-overlay').on('click', function (e) {
                    if (e.target === this) {
                        modal.fadeOut(300, () => modal.remove());
                    }
                });

                // Add to cart from modal
                modal.find('.modal-add-to-cart').on('click', function () {
                    const productId = $(this).data('product-id');
                    addToCart(productId, $(this));
                });

                // Prevent modal content click from closing modal
                modal.find('.product-modal').on('click', function (e) {
                    e.stopPropagation();
                });
            },
            error: function () {
                showNotification('Failed to load product details', 'error');
            }
        });
    }

    // Handle login (demo only — you should use modals or forms)
    $("#loginBtn").on("click", function () {
        const email = prompt("Email:");
        const password = prompt("Password:");

        $.post("/api/auth/login", { email, password })
            .done(function (data) {
                localStorage.setItem("bunbun_token", data.token);
                showNotification("Welcome " + data.user.fname + "!", 'success');
                location.reload();
            })
            .fail(function () {
                showNotification("Invalid credentials", 'error');
            });
    });

    $("#logoutBtn").on("click", function () {
        localStorage.removeItem("bunbun_token");
        location.reload();
    });

    // Initialize cart count on page load
    updateCartCount();
});

// Slider functionality
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
    const grid = document.getElementById(`${section}-grid`);
    const indicators = document.getElementById(`${section}-indicators`);

    if (!grid || !indicators) return; // 🛑 Safeguard

    const cards = grid.querySelectorAll('.product-card');

    if (cards.length === 0) return;

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
document.addEventListener('DOMContentLoaded', function () {
    // Initialize indicators
    setTimeout(() => {
        updateIndicators('new');
        updateIndicators('popular');
    }, 100);

    // Update indicators on window resize
    window.addEventListener('resize', function () {
        updateIndicators('new');
        updateIndicators('popular');
    });

    // Animate product cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
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

    // Add swipe functionality for mobile
    let startX = 0;
    let scrollLeft = 0;

    document.querySelectorAll('.products-grid').forEach(grid => {
        grid.addEventListener('touchstart', function (e) {
            startX = e.touches[0].pageX - grid.offsetLeft;
            scrollLeft = grid.scrollLeft;
        });

        grid.addEventListener('touchmove', function (e) {
            e.preventDefault();
            const x = e.touches[0].pageX - grid.offsetLeft;
            const walk = (x - startX) * 2;
            grid.scrollLeft = scrollLeft - walk;
        });
    });
});


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


