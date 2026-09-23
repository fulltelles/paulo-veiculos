import { supabase } from './supabaseClient.js';

const tbody = document.getElementById('admin-car-list');
const modal = document.getElementById('car-modal');
const form = document.getElementById('car-form');
const btnAdd = document.getElementById('btn-add-car');
const btnCancel = document.getElementById('btn-cancel');
const modalTitle = document.getElementById('modal-title');

let carsData = [];

// Modal Logic
function openModal(car = null) {
  modal.classList.add('open');
  if (car) {
    modalTitle.textContent = 'Editar Veículo';
    document.getElementById('car-id').value = car.id;
    document.getElementById('car-make').value = car.make;
    document.getElementById('car-model').value = car.model;
    document.getElementById('car-year').value = car.year;
    document.getElementById('car-mileage').value = car.mileage;
    document.getElementById('car-price').value = car.price;
    document.getElementById('car-type').value = car.type;
    document.getElementById('car-image').value = car.image;
    document.getElementById('car-status').value = car.status;
  } else {
    modalTitle.textContent = 'Adicionar Veículo';
    form.reset();
    document.getElementById('car-id').value = '';
    document.getElementById('car-status').value = 'available';
  }
}

function closeModal() {
  modal.classList.remove('open');
}

btnAdd.addEventListener('click', () => openModal());
btnCancel.addEventListener('click', closeModal);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerText;
  submitBtn.innerText = 'Salvando...';
  submitBtn.disabled = true;

  const carData = {
    make: document.getElementById('car-make').value,
    model: document.getElementById('car-model').value,
    year: parseInt(document.getElementById('car-year').value),
    mileage: document.getElementById('car-mileage').value,
    price: document.getElementById('car-price').value,
    type: document.getElementById('car-type').value,
    image: document.getElementById('car-image').value,
    status: document.getElementById('car-status').value,
  };

  const id = document.getElementById('car-id').value;

  try {
    if (id) {
      const { error } = await supabase.from('cars').update(carData).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('cars').insert([carData]);
      if (error) throw error;
    }
    closeModal();
    loadCars();
  } catch (err) {
    console.error("Error saving car:", err);
    alert("Erro ao salvar o veículo. Verifique permissões do Supabase.");
  } finally {
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
  }
});

window.deleteCar = async function(id) {
  if (confirm("Tem certeza que deseja excluir este veículo?")) {
    try {
      const { error } = await supabase.from('cars').delete().eq('id', id);
      if (error) throw error;
      loadCars();
    } catch (err) {
      console.error("Error deleting car:", err);
      alert("Erro ao excluir veículo.");
    }
  }
};

window.editCar = function(id) {
  const car = carsData.find(c => c.id == id);
  if (car) openModal(car);
};

async function loadCars() {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('id', { ascending: true });
      
    if (error) throw error;
    
    carsData = data || [];
    
    if (carsData.length > 0) {
      renderAdminTable(carsData);
    } else {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum carro encontrado.</td></tr>';
    }
  } catch (err) {
    console.error("Error loading cars:", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erro ao carregar dados do Supabase. Verifique as credenciais no .env.</td></tr>`;
  }
}

function renderAdminTable(cars) {
  tbody.innerHTML = '';
  
  cars.forEach(car => {
    const isSold = car.status === 'sold';
    const statusClass = isSold ? 'status-sold' : 'status-available';
    const statusText = isSold ? 'VENDIDO' : 'DISPONÍVEL';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${car.id}</td>
      <td><strong>${car.make} ${car.model}</strong></td>
      <td>${car.year}</td>
      <td>${car.price}</td>
      <td>
        <button class="status-toggle ${statusClass}" data-id="${car.id}" data-status="${car.status}">
          ${statusText}
        </button>
      </td>
      <td>
        <button class="admin-btn btn-edit" onclick="editCar(${car.id})"><i data-lucide="edit"></i></button>
        <button class="admin-btn btn-delete" onclick="deleteCar(${car.id})"><i data-lucide="trash-2"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  lucide.createIcons();
  
  // Attach status toggle events
  document.querySelectorAll('.status-toggle').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      const currentStatus = e.target.getAttribute('data-status');
      const newStatus = currentStatus === 'sold' ? 'available' : 'sold';
      
      e.target.innerText = 'Atualizando...';
      
      try {
        const { error } = await supabase.from('cars').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
        loadCars();
      } catch (err) {
        console.error("Error updating status:", err);
        alert("Erro ao atualizar status.");
        loadCars();
      }
    });
  });
}

// Init
loadCars();
