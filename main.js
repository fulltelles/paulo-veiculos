import { supabase } from './supabaseClient.js';

const html = document.documentElement;
const canvas = document.getElementById("hero-lightpass");
const context = canvas ? canvas.getContext("2d") : null;

const frameCount = 229;
const currentFrame = index => (
  `/frames_optimized/${index.toString().padStart(3, '0')}.webp`
);

// Array para guardar as imagens descompactadas na RAM
const imageCache = [];

// Preload images memory
const preloadImages = () => {
  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    imageCache[i] = img; // Salva a referência do objeto para não recarregar
  }
};
preloadImages(); // Carregar imediatamente

const initialFrame = 2; // Evitar a tela preta inicial

// Inicializa a imagem no canvas assim que carregar
if (canvas && context) {
  imageCache[initialFrame].onload = function(){
    canvas.width = imageCache[initialFrame].width || 1920;
    canvas.height = imageCache[initialFrame].height || 1080;
    context.drawImage(imageCache[initialFrame], 0, 0, canvas.width, canvas.height);
  }
}

const updateImage = index => {
  // Pega a imagem direto da memória RAM ao invés de buscar do disco/rede
  const imgObj = imageCache[index];
  if(imgObj && imgObj.complete && context) {
    context.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
  }
}

const scrollWrapper = document.querySelector('.hero-scroll-wrapper');
const steps = document.querySelectorAll('.story-step');
let currentSlide = 0;
let currentFrameDrawn = initialFrame;
let targetFrame = initialFrame;
let targetTranslateY = 0;
let currentTranslateY = 0;
let targetTranslateX = 0;
let currentTranslateX = 0;
const scrollCar = document.getElementById('scroll-car');

window.addEventListener('scroll', () => {
  // Update Navbar
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  
  // Scrollytelling Logic
  if (scrollWrapper) {
    const rect = scrollWrapper.getBoundingClientRect();
    const scrollTop = -rect.top; 
    const scrollHeight = rect.height - window.innerHeight; 
    
    let progress = scrollTop / scrollHeight;
    progress = Math.max(0, Math.min(1, progress)); // Clamp 0 to 1
    
    // 1. Car Scroll Logic
    if (scrollCar) {
      const isMobile = window.innerWidth <= 900;
      if (isMobile) {
        // Car animation disabled on mobile for cleaner UI
        targetTranslateX = 0;
        targetTranslateY = 0;
      } else {
        // Vertical scroll for desktop
        const maxTranslateY = window.innerHeight * 0.7;
        targetTranslateY = progress * maxTranslateY;
        targetTranslateX = 0;
      }
    }
    
    // 1.5 Cinematic Zoom Parallax on the Video Canvas
    const canvasElement = document.getElementById('hero-lightpass');
    if (canvasElement) {
      const scaleValue = 1.0 + (progress * 0.15);
      canvasElement.style.transform = `scale(${scaleValue})`;
    }

    // 2. Determine which slide to show based on progress
    let newSlide = 0;
    if (progress >= 0.66) {
      newSlide = 2;
    } else if (progress >= 0.33) {
      newSlide = 1;
    } else {
      newSlide = 0;
    }
    
    if (newSlide !== currentSlide) {
      currentSlide = newSlide;
      
      // Update UI Texts
      steps.forEach(s => s.classList.remove('active'));
      const activeStep = steps[currentSlide];
      if (activeStep) {
        activeStep.classList.add('active');
        
        // Jump to the frame of the next text
        const frame = parseInt(activeStep.getAttribute('data-frame'), 10);
        if (!isNaN(frame)) {
          targetFrame = frame;
        }
      }
    }
  }
});

// Playback Animation Loop
function animateVideo() {
  if (currentFrameDrawn < targetFrame) {
    currentFrameDrawn += 1; // Forward playback speed (slower)
    if (currentFrameDrawn > targetFrame) currentFrameDrawn = targetFrame;
  } else if (currentFrameDrawn > targetFrame) {
    currentFrameDrawn -= 1; // Reverse playback speed (slower)
    if (currentFrameDrawn < targetFrame) currentFrameDrawn = targetFrame;
  }
  
  updateImage(Math.round(currentFrameDrawn));
  
  if (scrollCar) {
    const isMobile = window.innerWidth <= 900;
    // 0.04 factor creates a heavier, more natural delay on the car physics
    currentTranslateY += (targetTranslateY - currentTranslateY) * 0.04;
    currentTranslateX += (targetTranslateX - currentTranslateX) * 0.04;
    
    // Simulate complex, unpredictable speed variation and steering
    const time = performance.now() / 1000; // time in seconds
    
    // Combine 3 sine waves for unpredictable forward/backward glide (acceleration/braking)
    const forwardGlide = (Math.sin(time * 1.5) + Math.sin(time * 0.8 + 2) + Math.sin(time * 2.3 + 1)) * 6; 
    
    // Combine 2 sine waves for subtle left/right steering corrections
    const steeringCorrection = (Math.sin(time * 0.7) + Math.sin(time * 1.2 + 3)) * 3;
    
    if (isMobile) {
      // Horizontal motion: X is forward, Y is steering
      const finalX = currentTranslateX + forwardGlide;
      const finalY = steeringCorrection;
      scrollCar.style.transform = `translate(${finalX}px, calc(-50% + ${finalY}px)) rotate(90deg)`;
    } else {
      // Vertical motion: Y is forward, X is steering
      const finalY = currentTranslateY + forwardGlide;
      const finalX = steeringCorrection;
      scrollCar.style.transform = `translate(${finalX}px, ${finalY}px) rotate(180deg)`;
    }
  }
  
  requestAnimationFrame(animateVideo);
}

// Start the loop
animateVideo();

// --- CATALOG LOGIC ---
let cars = [];

const grid = document.getElementById('car-grid');
const filterBtns = document.querySelectorAll('.filter-btn');

async function fetchCars() {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('id', { ascending: true });
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      cars = data;
    } else {
      // Fallback data if table is empty or missing
      cars = [
        { id: 1, make: 'BMW', model: 'X6 M Sport', year: 2023, color: 'Preto Metálico', mileage: '15.000 km', price: 'R$ 750.000', type: 'suv', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', status: 'available' },
        { id: 2, make: 'Audi', model: 'RS e-tron GT', year: 2024, color: 'Cinza Nardo', mileage: '5.000 km', price: 'R$ 980.000', type: 'sport', image: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', status: 'sold' },
        { id: 3, make: 'Mercedes-Benz', model: 'C 300 AMG Line', year: 2022, color: 'Pranco Polar', mileage: '25.000 km', price: 'R$ 380.000', type: 'sedan', image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', status: 'available' },
        { id: 4, make: 'Porsche', model: 'Cayenne Coupé', year: 2023, color: 'Cinza Gelo', mileage: '12.000 km', price: 'R$ 820.000', type: 'suv', image: 'https://images.unsplash.com/photo-1503376710356-70e68c85b57d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', status: 'available' },
        { id: 5, make: 'BMW', model: '320i M Sport', year: 2022, color: 'Azul Portimao', mileage: '30.000 km', price: 'R$ 310.000', type: 'sedan', image: 'https://images.unsplash.com/photo-1556800572-1b8aeef2c54f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', status: 'available' },
        { id: 6, make: 'Porsche', model: '911 Carrera S', year: 2021, color: 'Amarelo Racing', mileage: '18.000 km', price: 'R$ 1.150.000', type: 'sport', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', status: 'available' }
      ];
    }
  } catch (err) {
    console.error("Error fetching cars:", err);
  }
  
  // Re-render after fetch
  renderCars();
}

function renderCars(filterType = 'all') {
  grid.innerHTML = '';
  if (cars.length === 0) return; // Prevent render if data isn't loaded yet
  
  const filtered = filterType === 'all' ? cars : cars.filter(c => c.type === filterType);
  
  filtered.forEach(car => {
    const card = document.createElement('div');
    card.className = 'car-card';
    const isSold = car.status === 'sold';
    const badgeText = isSold ? 'VENDIDO' : (car.id % 2 === 0 ? 'NOVO' : 'DESTAQUE');
    const badgeClass = isSold ? 'sold' : (car.id % 2 === 0 ? 'novo' : 'destaque');
    const badgeHtml = `<div class="status-badge ${badgeClass}">${badgeText}</div>`;
    
    // Links wrapped on the whole card to match layout style since button is hidden
    const btnHtml = isSold 
      ? `<button class="car-btn sold-btn" disabled>Veículo Vendido</button>` 
      : `<a href="/details.html?id=${car.id}" class="car-btn">Ver Detalhes</a>`;
      
    const imgHtml = isSold
      ? `<img src="${car.image}" alt="${car.make} ${car.model}" class="car-img" loading="lazy">`
      : `<img src="${car.image}" alt="${car.make} ${car.model}" class="car-img" loading="lazy">`;

    const cardContent = `
      <div class="img-wrapper">
        ${badgeHtml}
        ${imgHtml}
      </div>
      <div class="car-info">
        <h3 class="car-title">${car.make} ${car.model}</h3>
        <p class="car-price-subtle">${car.price}</p>
        
        <div class="car-features-grid">
          <div class="feature-item">
            <span class="f-label">Marca</span>
            <span class="f-value">${car.make}</span>
          </div>
          <div class="feature-item">
            <span class="f-label">Ano</span>
            <span class="f-value">${car.year}</span>
          </div>
          <div class="feature-item">
            <span class="f-label">Cor</span>
            <span class="f-value">${car.color || 'Prata'}</span>
          </div>
          <div class="feature-item">
            <span class="f-label">Km</span>
            <span class="f-value">${car.mileage}</span>
          </div>
        </div>
        ${btnHtml}
      </div>
    `;
    
    if(!isSold) {
      card.innerHTML = `<a href="/details.html?id=${car.id}" style="text-decoration:none; color:inherit; display:block;">${cardContent}</a>`;
    } else {
      card.innerHTML = cardContent;
    }
    grid.appendChild(card);
  });
  lucide.createIcons();
}

// Initial render sequence
renderCars(); // Render empty or placeholder first
fetchCars();  // Fetch and re-render

// Filter Event Listeners
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active class
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Render
    const type = btn.getAttribute('data-filter');
    renderCars(type);
  });
});

// --- MOBILE MENU LOGIC ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileCloseBtn = document.getElementById('mobile-close-btn');
const mobileMenuOverlay = document.getElementById('mobile-menu');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

if (mobileMenuBtn && mobileCloseBtn && mobileMenuOverlay) {
  const toggleMenu = () => {
    mobileMenuOverlay.classList.toggle('open');
    document.body.style.overflow = mobileMenuOverlay.classList.contains('open') ? 'hidden' : '';
  };

  mobileMenuBtn.addEventListener('click', toggleMenu);
  mobileCloseBtn.addEventListener('click', toggleMenu);

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuOverlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

lucide.createIcons();