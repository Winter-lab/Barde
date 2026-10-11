// --- Configuration des tuiles minimalistes Gratuites & Sans Clé API ---
const darkTileUrl = 'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';
const lightTileUrl = 'https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png';
const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> | <b>Barde</b>';

const map = L.map('map', { 
  zoomControl: false 
}).setView([43.2965, 5.3698], 13);

let currentTileLayer = L.tileLayer(darkTileUrl, {
  maxZoom: 19,
  subdomains: 'abcd',
  attribution: tileAttribution
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

// Bascule de thème Sombre / Clair
let isDarkMode = true;
const themeBtn = document.getElementById('btn-theme');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    map.removeLayer(currentTileLayer);
    if (isDarkMode) {
      currentTileLayer = L.tileLayer(lightTileUrl, { maxZoom: 19, subdomains: 'abcd', attribution: tileAttribution }).addTo(map);
      themeBtn.textContent = '☀️';
      isDarkMode = false;
    } else {
      currentTileLayer = L.tileLayer(darkTileUrl, { maxZoom: 19, subdomains: 'abcd', attribution: tileAttribution }).addTo(map);
      themeBtn.textContent = '🌙';
      isDarkMode = true;
    }
  });
}

const markersLayer = L.layerGroup().addTo(map);

// Icônes agrandies (44px x 44px)
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
    iconSize: [44, 44],
    iconAnchor: [22, 44]
  });
}

let allPlaces = [];
let userCoords = null;

// Chargement des lieux depuis places.json
fetch('./data/places.json')
  .then(response => response.json())
  .then(data => {
    allPlaces = data.filter(p => p.status === 'active');
    renderMarkers(allPlaces);
    initFilters(allPlaces, (filteredPlaces) => {
      renderMarkers(filteredPlaces);
    });
  })
  .catch(err => console.error("Erreur de chargement des lieux :", err));

function updatePlacesCount(count) {
  const countBadge = document.getElementById('places-count');
  if (countBadge) {
    countBadge.textContent = count > 1 ? `${count} lieux` : `${count} lieu`;
  }
}

function renderMarkers(places) {
  markersLayer.clearLayers();
  updatePlacesCount(places.length);

  places.forEach(place => {
    const marker = L.marker([place.lat, place.lng], {
      icon: createBardeIcon(place)
    });

    marker.on('click', () => showPlaceDetails(place));
    markersLayer.addLayer(marker);
  });
}

// Calcul de distance (Formule de Haversine)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km) {
  if (km < 1) return `à ~${Math.round(km * 1000)} m de vous`;
  return `à ~${km.toFixed(1)} km de vous`;
}

// Gestion des favoris (LocalStorage)
function isFavorite(id) {
  const favs = JSON.parse(localStorage.getItem('barde_favorites') || '[]');
  return favs.includes(id);
}

function toggleFavorite(id) {
  let favs = JSON.parse(localStorage.getItem('barde_favorites') || '[]');
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }
  localStorage.setItem('barde_favorites', JSON.stringify(favs));
  const currentPlace = allPlaces.find(p => p.id === id);
  if (currentPlace) showPlaceDetails(currentPlace);
}

// Partage sécurisé par ID (sans erreur d'échappement d'apostrophes)
function sharePlaceById(id) {
  const place = allPlaces.find(p => p.id === id);
  if (!place) return;

  if (navigator.share) {
    navigator.share({
      title: place.name,
      text: `Découvre ${place.name} à Marseille sur Barde !`,
      url: window.location.href
    }).catch(err => console.log(err));
  } else {
    navigator.clipboard.writeText(`${place.name} - ${place.address}`);
    alert("Adresse copiée dans le presse-papier !");
  }
}

// Affichage du panneau de détails
function showPlaceDetails(place) {
  const panel = document.getElementById('place-panel');
  const panelContent = document.getElementById('panel-content');
  
  const tagsHtml = place.genres.map(g => `<span class="badge">${g}</span>`).join(' ');
  const tempBadge = place.is_temporary ? '<span class="badge badge-warning">📍 Éphémère</span>' : '';
  const intimateBadge = place.is_intimate ? '<span class="badge badge-info">🏠 Intimiste</span>' : '';
  const favIcon = isFavorite(place.id) ? '❤️' : '🤍';

  let distanceHtml = '';
  if (userCoords) {
    const distKm = getDistanceFromLatLonInKm(userCoords[0], userCoords[1], place.lat, place.lng);
    distanceHtml = `<div class="distance-badge">📍 ${formatDistance(distKm)}</div>`;
  }

  const mapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  
  panelContent.innerHTML = `
    <div class="panel-header">
      <h2>${place.name}</h2>
      <div class="panel-header-actions">
        <button onclick="toggleFavorite('${place.id}')" class="btn-fav" title="Mettre en favori">${favIcon}</button>
        <button onclick="closePanel()" class="btn-close">✕</button>
      </div>
    </div>
    <p class="neighborhood">📍 ${place.neighborhood || place.address}</p>
    ${distanceHtml}
    <div class="badges">
      ${tempBadge} ${intimateBadge} ${tagsHtml}
    </div>
    <p class="description">${place.description || ''}</p>
    <p class="capacity">👥 Capacité : ${place.capacity ? place.capacity + ' pers.' : 'Non spécifiée'}</p>
    
    <div class="panel-links">
      <a href="${mapsNavUrl}" target="_blank" rel="noopener" class="btn btn-nav">🗺️ Y aller</a>
      <button onclick="sharePlaceById('${place.id}')" class="btn btn-share">📲 Partager</button>
      ${place.links.program ? `<a href="${place.links.program}" target="_blank" rel="noopener" class="btn btn-primary">📅 Program</a>` : ''}
      ${place.links.instagram ? `<a href="${place.links.instagram}" target="_blank" rel="noopener" class="btn btn-secondary">📸 Insta</a>` : ''}
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

// Geste Swipe-to-close sur mobile
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
  if (deltaY > 0) panel.style.transform = `translateY(${deltaY}px)`;
}, { passive: true });

panel.addEventListener('touchend', () => {
  if (!isDragging) return;
  isDragging = false;
  panel.classList.remove('dragging');
  const deltaY = currentY - startY;
  if (deltaY > 100) closePanel();
  else panel.style.transform = '';
  startY = 0;
  currentY = 0;
});

// Géolocalisation GPS
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

        userCoords = [lat, lng];
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
