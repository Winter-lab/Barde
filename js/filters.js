let activeFilters = {
  search: '',
  category: 'all'
};

function initFilters(placesData, onFilterChange) {
  const searchInput = document.getElementById('search-input');
  const filterButtons = document.querySelectorAll('.filter-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeFilters.search = e.target.value.toLowerCase().trim();
      applyFilters(placesData, onFilterChange);
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterButtons.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeFilters.category = e.currentTarget.getAttribute('data-filter');
      applyFilters(placesData, onFilterChange);
    });
  });
}

function applyFilters(placesData, callback) {
  const favorites = JSON.parse(localStorage.getItem('barde_favorites') || '[]');

  const filtered = placesData.filter(place => {
    const matchesSearch = 
      place.name.toLowerCase().includes(activeFilters.search) ||
      (place.neighborhood && place.neighborhood.toLowerCase().includes(activeFilters.search)) ||
      (place.address && place.address.toLowerCase().includes(activeFilters.search)) ||
      place.genres.some(g => g.toLowerCase().includes(activeFilters.search)) ||
      (place.description && place.description.toLowerCase().includes(activeFilters.search));

    if (!matchesSearch) return false;

    const cat = activeFilters.category;
    if (cat === 'all') return true;
    if (cat === 'favorites') return favorites.includes(place.id);
    if (cat === 'ephemeral') return place.is_temporary === true;
    if (cat === 'intimate') return place.is_intimate === true;
    
    return place.categories.includes(cat);
  });

  if (typeof callback === 'function') {
    callback(filtered);
  }
}
