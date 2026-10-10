const map = L.map('map', {
  zoomControl: false
}).setView([43.2965, 5.3698], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <b>Barde</b>'
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

const markersLayer = L.layerGroup().addTo(map);

function createBardeIcon(place) {
  let iconHtml = '🎵';
  let className = 'barde-marker';

  if (place.is_temporary) {
    iconHtml = '📍';
    className += ' marker-ephemeral';
  } else if (place.is_intimate) {
    iconHtml = '🏠';
    className += ' marker-intimate';
  } else if (place.categories.includes('jazz')) {
    iconHtml = '🎷';
  } else if (place.categories.includes('bar_musical')) {
    iconHtml = '🍻';
  }

  return L.divIcon({
    html: `<div class="marker-inner">${iconHtml}</div>`,
    className: className,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
}

let allPlaces = [];

fetch('./data/places.json')
  .then(response => response.json())
  .then(data => {
    allPlaces = data.filter(p => p.status === 'active');
    renderMarkers(allPlaces);
    initFilters(allPlaces, (filteredPlaces) => {
      renderMarkers(filteredPlaces);
    });
  });

function renderMarkers(places) {
  markersLayer.clearLayers();
  places.forEach(place => {
    const marker = L.marker([place.lat, place.lng], {
      icon: createBardeIcon(place)
    });

    marker.on('click', () => showPlaceDetails(place));
    markersLayer.addLayer(marker);
  });
}

function showPlaceDetails(place) {
  const panel = document.getElementById('place-panel');
  const panelContent = document.getElementById('panel-content');
  
  const tagsHtml = place.genres.map(g => `<span class="badge">${g}</span>`).join(' ');
  const tempBadge = place.is_temporary ? '<span class="badge badge-warning">📍 Éphémère</span>' : '';
  const intimateBadge = place.is_intimate ? '<span class="badge badge-info">🏠 Intimiste</span>' : '';
  
  panelContent.innerHTML = `
    <div class="panel-header">
      <h2>${place.name}</h2>
      <button onclick="closePanel()" class="btn-close">✕</button>
    </div>
    <p class="neighborhood">📍 ${place.neighborhood || place.address}</p>
    <div class="badges">
      ${tempBadge} ${intimateBadge} ${tagsHtml}
    </div>
    <p class="description">${place.description || ''}</p>
    <p class="capacity">👥 Capacité : ${place.capacity ? place.capacity + ' pers.' : 'Non spécifiée'}</p>
    
    <div class="panel-links">
      ${place.links.program ? `<a href="${place.links.program}" target="_blank" class="btn btn-primary">📅 Program</a>` : ''}
      ${place.links.instagram ? `<a href="${place.links.instagram}" target="_blank" class="btn btn-secondary">📸 Insta</a>` : ''}
      ${place.links.website ? `<a href="${place.links.website}" target="_blank" class="btn btn-outline">🌐 Site</a>` : ''}
    </div>
    
    <div class="panel-footer">
      <small>Dernière vérification : ${place.last_checked}</small>
    </div>
  `;
  
  panel.classList.add('active');
}

function closePanel() {
  const panel = document.getElementById('place-panel');
  panel.classList.remove('active');
  panel.style.transform = '';
}

// Swipe logic
const panel = document.getElementById('place-panel');
let startY = 0;
let currentY = 0;
let isDragging = false;

panel.addEventListener('touchstart', (e) => {
  if (!panel.classList.contains('active') || panel.scrollTop > 0) return;
  startY = e.touches[0].clientY;
  isDragging = true;
  panel.classList.add('dragging');
}, { passive: true });

panel.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  currentY = e.touches[0].clientY;
  const deltaY = currentY - startY;
  if (deltaY > 0) {
    panel.style.transform = `translateY(${deltaY}px)`;
  }
}, { passive: true });

panel.addEventListener('touchend', () => {
  if (!isDragging) return;
  isDragging = false;
  panel.classList.remove('dragging');
  const deltaY = currentY - startY;
  if (deltaY > 100) {
    closePanel();
  } else {
    panel.style.transform = '';
  }
  startY = 0;
  currentY = 0;
});

// GPS
let userMarker = null;
let userAccuracyCircle = null;
const locateBtn = document.getElementById('btn-locate');

if (locateBtn) {
  locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    locateBtn.style.opacity = '0.6';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        locateBtn.style.opacity = '1';
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        map.setView([lat, lng], 15);

        if (userMarker) {
          map.removeLayer(userMarker);
          map.removeLayer(userAccuracyCircle);
        }

        userAccuracyCircle = L.circle([lat, lng], {
          radius: accuracy,
          color: '#3498db',
          fillColor: '#3498db',
          fillOpacity: 0.15,
          weight: 1
        }).addTo(map);

        const userIcon = L.divIcon({
          html: `<div class="user-gps-dot"></div>`,
          className: 'user-gps-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
        userMarker.bindPopup("<b>Vous êtes ici</b>").openPopup();
      },
      (error) => {
        locateBtn.style.opacity = '1';
        alert("Impossible de récupérer votre position.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}
