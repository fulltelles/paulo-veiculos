import { supabase } from './supabaseClient.js';

const loading = document.getElementById('details-loading');
const errorState = document.getElementById('details-error');
const content = document.getElementById('details-content');

async function loadCarDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  if (!id) {
    showError();
    return;
  }

  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw error || new Error("Carro não encontrado");
    }

    renderCar(data);
  } catch (err) {
    console.error(err);
    showError();
  }
}

function renderCar(car) {
  loading.style.display = 'none';
  content.style.display = 'flex';

  document.getElementById('detail-img').src = car.image;
  document.getElementById('detail-title').textContent = `${car.make} ${car.model}`;
  document.getElementById('detail-year').textContent = car.year;
  document.getElementById('detail-mileage').textContent = car.mileage;
  document.getElementById('detail-type').textContent = car.type;
  document.getElementById('detail-price').textContent = car.price;

  const isSold = car.status === 'sold';
  if (isSold) {
    document.getElementById('detail-badge').style.display = 'block';
  }

  const actionWrapper = document.getElementById('action-wrapper');
  if (isSold) {
    actionWrapper.innerHTML = `<button class="car-btn sold-btn" disabled style="width:100%; padding: 1.2rem; font-size: 1.1rem;">Veículo Vendido</button>`;
  } else {
    const message = encodeURIComponent(`Olá, tenho interesse no ${car.make} ${car.model} ${car.year} anunciado por ${car.price}.`);
    const whatsappUrl = `https://wa.me/5511999999999?text=${message}`;
    
    actionWrapper.innerHTML = `
      <a href="${whatsappUrl}" target="_blank" class="btn-whatsapp">
        <i data-lucide="phone"></i> Falar com Vendedor
      </a>
    `;
  }
  
  lucide.createIcons();
}

function showError() {
  loading.style.display = 'none';
  errorState.style.display = 'block';
}

// Initial Load
loadCarDetails();
