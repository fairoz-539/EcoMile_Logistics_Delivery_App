// import { auth, provider, db } from "./firebase-config.js";
// import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// let map = null;
// let routePolyline = null;
// let routeMarkers = [];
// let vehicleMarker = null;
// let competitorMarkers = [];
// let pins = [];
// let routeData = null;
// let db_ref = ref(db);

// const vehicleIcon = L.icon({
//     iconUrl: '/static/images/car.png',
//     iconSize: [40, 40],
//     iconAnchor: [20, 20]
// });

// function updateVoiceStatus(message, isError = false) {
//     const voiceStatus = document.getElementById('voice-status');
//     if (voiceStatus) {
//         voiceStatus.textContent = message;
//         voiceStatus.classList.remove('hidden', 'text-red-600', 'text-gray-600');
//         voiceStatus.classList.add(isError ? 'text-red-600' : 'text-gray-600');
//         setTimeout(() => voiceStatus.classList.add('hidden'), 3000);
//     }
// }

// function renumberLabels() {
//     const addressEntries = document.getElementById('address-list')?.getElementsByClassName('address-entry');
//     Array.from(addressEntries || []).forEach((entry, index) => {
//         const label = entry.querySelector('label');
//         if (label) label.textContent = `Delivery ${index + 1}`;
//     });
// }

// document.getElementById('add-address')?.addEventListener('click', () => {
//     const addressList = document.getElementById('address-list');
//     const count = addressList?.getElementsByClassName('address-entry').length || 0;
//     const div = document.createElement('div');
//     div.className = 'address-entry flex-col items-center mb-2 mt-2';
//     div.innerHTML = `
//         <label class="block text-sm text-gray-600 mb-2 mr-2">Delivery ${count + 1}</label>
//         <div class="flex">
//             <input type="text" class="address-input w-full p-2 bg-gray-100 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Enter delivery address" required>
//             <button type="button" class="remove-address ml-2 bg-red-600 text-white py-1 px-2 rounded-md hover:bg-red-700 transition">Remove</button>
//         </div>
//     `;
//     addressList.appendChild(div);
//     updateLaunchButton();
//     if (count >= 1) {
//         document.querySelectorAll('.remove-address').forEach(button => {
//             button.addEventListener('click', (e) => {
//                 const entry = e.target.closest('.address-entry');
//                 if (entry) {
//                     addressList.removeChild(entry);
//                     updateLaunchButton();
//                     renumberLabels();
//                 }
//             });
//         });
//     }
// });

// document.getElementById('voice-btn')?.addEventListener('click', async () => {
//     const voiceBtn = document.getElementById('voice-btn');
//     const voiceLoading = document.getElementById('voice-loading');

//     if (!navigator.mediaDevices || !window.MediaRecorder) {
//         updateVoiceStatus('Your browser does not support audio recording.', true);
//         return;
//     }

//     try {
//         voiceLoading.classList.remove('hidden');
//         voiceBtn.disabled = true;
//         updateVoiceStatus('Requesting microphone access...');

//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         const mediaRecorder = new MediaRecorder(stream);
//         const audioChunks = [];

//         mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
//         mediaRecorder.onstop = async () => {
//             const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
//             const arrayBuffer = await audioBlob.arrayBuffer();
//             const base64Audio = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

//             if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
//                 const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
//                 recognition.lang = 'en-US';
//                 recognition.onresult = (event) => {
//                     const transcribedAddress = event.results[0][0].transcript;
//                     const addressInputs = document.getElementsByClassName('address-input');
//                     const lastInput = addressInputs[addressInputs.length - 1];
//                     if (lastInput) {
//                         lastInput.value = transcribedAddress;
//                         lastInput.dispatchEvent(new Event('input'));
//                         updateVoiceStatus('Address added: ' + transcribedAddress);
//                     }
//                 };
//                 recognition.onerror = (event) => updateVoiceStatus('Failed to transcribe audio: ' + event.error, true);
//                 recognition.onend = () => {
//                     stream.getTracks().forEach(track => track.stop());
//                     voiceLoading.classList.add('hidden');
//                     voiceBtn.disabled = false;
//                 };
//                 recognition.start();
//             }
//         };

//         mediaRecorder.start();
//         updateVoiceStatus('Recording... Speak the address now.');
//         setTimeout(() => mediaRecorder.stop(), 10000);
//     } catch (error) {
//         updateVoiceStatus('Failed to access microphone: ' + error.message, true);
//         voiceLoading.classList.add('hidden');
//         voiceBtn.disabled = false;
//     }
// });

// function updateLaunchButton() {
//     const launchBtn = document.getElementById('launch-btn');
//     const startAddress = document.getElementById('start-address')?.value.trim() || '';
//     const endAddresses = Array.from(document.getElementsByClassName('address-input') || []).map(input => input.value.trim()).filter(val => val);
//     if (launchBtn) launchBtn.disabled = !startAddress || endAddresses.length < 1;
//     console.log('Start Address:', startAddress, 'End Addresses:', endAddresses);
// }

// function initializeMap() {
//     if (!map) {
//         map = L.map('map').setView([13.0827, 80.2707], 13); // Default view (Chennai, India)
//         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//             attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//         }).addTo(map);
//     }
// }

// async function geocodeAddress(address) {
//     console.log('Geocoding address:', address);
//     const response = await fetch('/geocode', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ address: address + ", Chennai, India" })
//     });
//     const data = await response.json();
//     if (response.status !== 200 || data.error) throw new Error(data.error || 'Geocoding failed');
//     return data.coordinates;
// }

// async function fetchRoute(addresses, ecoMode) {
//     const allAddresses = [document.getElementById('start-address')?.value.trim() || '', ...addresses.map(addr => addr.trim())];
//     console.log('Sending addresses to backend:', allAddresses);
//     const coordinates = await Promise.all(allAddresses.map(geocodeAddress));
//     const response = await fetch('/calculate_route', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ addresses: allAddresses, ecoMode })
//     });
//     const data = await response.json();
//     if (response.status !== 200 || data.error) throw new Error(data.error || 'Route calculation failed');
//     return data;
// }

// document.getElementById('launch-btn')?.addEventListener('click', async () => {
//     const startAddress = document.getElementById('start-address')?.value.trim() || '';
//     const endAddresses = Array.from(document.getElementsByClassName('address-input') || []).map(input => input.value.trim()).filter(val => val);
//     if (!startAddress || endAddresses.length < 1) {
//         document.getElementById('error-message')?.classList.remove('hidden');
//         document.getElementById('error-message').textContent = 'Please enter a starting point and at least one ending point.';
//         return;
//     }

//     document.getElementById('error-message')?.classList.add('hidden');
//     if (vehicleMarker) map.removeLayer(vehicleMarker);
//     competitorMarkers.forEach(marker => map.removeLayer(marker));
//     competitorMarkers = [];
//     pins.forEach(pin => map.removeLayer(pin.marker));
//     pins = [];

//     try {
//         const data = await fetchRoute(endAddresses, document.getElementById('eco-mode')?.checked || false);
//         routeData = data;
//         console.log('Route data fetched:', routeData);
//         displayRoute(data);
//         updateAnalytics(data);
//         // Automatically trigger modals in sequence
//         showCompetitorModal().then((proceed) => {
//             if (proceed) {
//                 showCollaborationModal('competitor_1').then((proceed) => {
//                     if (proceed) {
//                         showNotificationModal();
//                     }
//                 });
//             }
//         });
//     } catch (error) {
//         document.getElementById('error-message')?.classList.remove('hidden');
//         document.getElementById('error-message').textContent = `Failed to calculate route: ${error.message}`;
//         console.error('Route calculation error:', error);
//     }
// });

// function displayRoute(data) {
//     if (routePolyline) map.removeLayer(routePolyline);
//     routeMarkers.forEach(marker => map.removeLayer(marker));
//     routeMarkers = [];
//     if (vehicleMarker) map.removeLayer(vehicleMarker);

//     const latlngs = data.geometry.map(coord => [coord[1], coord[0]]);
//     routePolyline = L.polyline(latlngs, { color: 'red', weight: 4, opacity: 0.8 }).addTo(map);

//     data.locations.forEach((loc, index) => {
//         const marker = L.marker([loc[1], loc[0]], { icon: L.divIcon({ className: 'custom-marker', iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(map);
//         routeMarkers.push(marker);
//     });
//     map.fitBounds(latlngs);

//     vehicleMarker = L.marker(latlngs[0], { icon: vehicleIcon }).addTo(map);
//     let i = 0;
//     function moveVehicle() {
//         if (i < latlngs.length) {
//             vehicleMarker.setLatLng(latlngs[i]);
//             i++;
//             setTimeout(moveVehicle, 20);
//         } else {
//             console.log('Vehicle animation complete');
//         }
//     }
//     moveVehicle();
// }

// function updateAnalytics(data) {
//     const totalDistance = data.total_distance || 0;
//     const totalDuration = data.total_duration || 0; // in minutes
//     const ecoMode = document.getElementById('eco-mode')?.checked || false;
//     const numStops = data.locations.length || 1;

//     document.getElementById('total-distance').textContent = totalDistance.toFixed(2) || 'N/A';
//     document.getElementById('total-co2').textContent = data.total_co2.toFixed(0) || 'N/A';
//     document.getElementById('fuel-consumption').textContent = data.analytics.fuel_consumption.toFixed(2) || 'N/A';
//     document.getElementById('fuel-savings').textContent = data.analytics.fuel_savings.toFixed(2) || 'N/A';
//     document.getElementById('total-delivery-time').textContent = totalDuration.toFixed(1) || 'N/A';
//     document.getElementById('cost-savings').textContent = data.analytics.cost_savings.toFixed(2) || 'N/A';
//     document.getElementById('traffic-delay').textContent = data.analytics.traffic_impact.toFixed(1) || 'N/A';
//     document.getElementById('co2-savings-vs-industry').textContent = data.analytics.co2_savings_vs_industry.toFixed(0) || 'N/A';
//     document.getElementById('efficiency-score').textContent = data.analytics.efficiency_score || 'N/A';
//     document.getElementById('sustainability-score').textContent = data.analytics.sustainability_score || 'N/A';
//     document.getElementById('avg-delivery-time').textContent = data.analytics.avg_delivery_time.toFixed(1) || 'N/A';
//     document.getElementById('driver-performance').textContent = data.analytics.driver_performance || 'N/A';
// }

// function showCompetitorModal() {
//     return new Promise((resolve) => {
//         const competitorModal = document.getElementById('competitor-modal');
//         if (competitorModal && routeData) {
//             console.log('Showing competitor modal');
//             competitorModal.classList.remove('hidden');
//             const okButton = document.getElementById('competitor-ok');
//             const skipButton = document.getElementById('competitor-skip');
//             okButton.onclick = () => {
//                 competitorModal.classList.add('hidden');
//                 resolve(true);
//             };
//             skipButton.onclick = () => {
//                 competitorModal.classList.add('hidden');
//                 resolve(false);
//             };
//         } else {
//             resolve(false);
//         }
//     });
// }

// function showCollaborationModal(competitorId) {
//     return new Promise((resolve) => {
//         const collaborationModal = document.getElementById('collaboration-modal');
//         if (collaborationModal && routeData) {
//             console.log('Showing collaboration modal');
//             collaborationModal.classList.remove('hidden');
//             document.getElementById('collaboration-text').textContent = `Interested in a deal with ${competitorId} sharing this route?`;
//             const proceedButton = document.getElementById('collaboration-proceed');
//             const cancelButton = document.getElementById('collaboration-cancel');
//             const closeButton = document.getElementById('collaboration-close');
//             proceedButton.onclick = () => {
//                 collaborationModal.classList.add('hidden');
//                 resolve(true);
//             };
//             cancelButton.onclick = () => {
//                 collaborationModal.classList.add('hidden');
//                 resolve(false);
//             };
//             closeButton.onclick = () => {
//                 collaborationModal.classList.add('hidden');
//                 resolve(false);
//             };
//         } else {
//             resolve(false);
//         }
//     });
// }

// function showNotificationModal() {
//     return new Promise((resolve) => {
//         const notificationModal = document.getElementById('notification-modal');
//         if (notificationModal && routeData) {
//             console.log('Showing notification modal');
//             notificationModal.classList.remove('hidden');
//             const okButton = document.getElementById('notify-ok');
//             const skipButton = document.getElementById('notify-skip');
//             okButton.onclick = () => {
//                 notificationModal.classList.add('hidden');
//                 resolve(true);
//             };
//             skipButton.onclick = () => {
//                 notificationModal.classList.add('hidden');
//                 resolve(false);
//             };
//         } else {
//             resolve(false);
//         }
//     });
// }

// document.addEventListener('DOMContentLoaded', () => {
//     initializeMap();

//     document.getElementById('competitor-ok').addEventListener('click', () => {
//         console.log('Competitor OK clicked');
//         fetch('/get_competitor_routes', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ geometry: routeData.geometry })
//         }).then(response => response.json()).then(data => {
//             data.competitor_routes.forEach(comp => {
//                 const latlngs = comp.geometry.map(coord => [coord[1], coord[0]]);
//                 L.polyline(latlngs, { color: '#ef4444', weight: 4, opacity: 0.8, dashArray: '5, 10' }).addTo(map);
//                 const marker = L.marker(latlngs[0], { icon: vehicleIcon }).addTo(map);
//                 let i = 0;
//                 function moveCompetitor() {
//                     if (i < latlngs.length) {
//                         marker.setLatLng(latlngs[i]);
//                         i++;
//                         setTimeout(moveCompetitor, 50);
//                     }
//                 }
//                 moveCompetitor();
//                 competitorMarkers.push(marker);
//             });
//         }).catch(error => alert('Failed to fetch competitor routes: ' + error.message));
//     });

//     document.getElementById('competitor-skip').addEventListener('click', () => {
//         console.log('Competitor Skip clicked');
//     });

//     document.getElementById('collaboration-proceed').addEventListener('click', () => {
//         console.log('Collaboration Proceed clicked');
//         const competitorId = document.getElementById('collaboration-text').textContent.match(/with (\w+)/)[1];
//         window.location.href = `/collaboration_hub?competitor_id=${competitorId}`;
//     });

//     document.getElementById('collaboration-cancel').addEventListener('click', () => {
//         console.log('Collaboration Cancel clicked');
//     });

//     document.getElementById('collaboration-close').addEventListener('click', () => {
//         console.log('Collaboration Close clicked');
//     });

//     document.getElementById('notify-ok').addEventListener('click', () => {
//         console.log('Notify OK clicked');
//         alert('ETA notification sent to customer! (Mocked)');
//     });

//     document.getElementById('notify-skip').addEventListener('click', () => {
//         console.log('Notify Skip clicked');
//     });

//     document.getElementById('reroute-btn')?.addEventListener('click', () => {
//         alert('Re-routing... (Mocked)');
//         document.getElementById('traffic-alert')?.classList.add('hidden');
//     });

//     document.getElementById('start-address')?.addEventListener('input', updateLaunchButton);
//     document.getElementById('address-list')?.addEventListener('input', updateLaunchButton);

//     const user = auth.currentUser;
//     if (user) {
//         const userId = user.uid;
//         onValue(ref(db, `routes/${userId}`), (snapshot) => {
//             const data = snapshot.val();
//             if (data) {
//                 routeData = Object.values(data)[0];
//                 if (routeData) {
//                     displayRoute(routeData);
//                     updateAnalytics(routeData);
//                     showCompetitorModal().then((proceed) => {
//                         if (proceed) {
//                             showCollaborationModal('competitor_1').then((proceed) => {
//                                 if (proceed) {
//                                     showNotificationModal();
//                                 }
//                             });
//                         }
//                     });
//                 }
//             }
//         });
//     }
//     console.log('DOM fully loaded, ready for modal triggers');
// });

import { auth, provider, db } from "./firebase-config.js";
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

let map = null;
let routePolyline = null;
let routeMarkers = [];
let vehicleMarker = null;
let competitorMarkers = [];
let pins = [];
let routeData = null;
let db_ref = ref(db);

const vehicleIcon = L.icon({
    iconUrl: '/static/images/car.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

function updateVoiceStatus(message, isError = false) {
    const voiceStatus = document.getElementById('voice-status');
    if (voiceStatus) {
        voiceStatus.textContent = message;
        voiceStatus.classList.remove('hidden', 'text-red-600', 'text-gray-600');
        voiceStatus.classList.add(isError ? 'text-red-600' : 'text-gray-600');
        setTimeout(() => voiceStatus.classList.add('hidden'), 3000);
    }
}

function renumberLabels() {
    const addressEntries = document.getElementById('address-list')?.getElementsByClassName('address-entry');
    Array.from(addressEntries || []).forEach((entry, index) => {
        const label = entry.querySelector('label');
        if (label) label.textContent = `Delivery ${index + 1}`;
    });
}

document.getElementById('add-address')?.addEventListener('click', () => {
    const addressList = document.getElementById('address-list');
    const count = addressList?.getElementsByClassName('address-entry').length || 0;
    const div = document.createElement('div');
    div.className = 'address-entry flex-col items-center mb-2 mt-2';
    div.innerHTML = `
        <label class="block text-sm text-gray-600 mb-2 mr-2">Delivery ${count + 1}</label>
        <div class="flex">
            <input type="text" class="address-input w-full p-2 bg-gray-100 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Enter delivery address" required>
            <button type="button" class="remove-address ml-2 bg-red-600 text-white py-1 px-2 rounded-md hover:bg-red-700 transition">Remove</button>
        </div>
    `;
    addressList.appendChild(div);
    updateLaunchButton();
    if (count >= 1) {
        document.querySelectorAll('.remove-address').forEach(button => {
            button.addEventListener('click', (e) => {
                const entry = e.target.closest('.address-entry');
                if (entry) {
                    addressList.removeChild(entry);
                    updateLaunchButton();
                    renumberLabels();
                }
            });
        });
    }
});

document.getElementById('voice-btn')?.addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent default <a> tag behavior

    if (!navigator.mediaDevices || !window.MediaRecorder) {
        alert('Your browser does not support audio recording.');
        return;
    }

    try {
        console.log('Requesting microphone access...');

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(
                new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            // Gemini API Key and Request
            const GEMINI_API_KEY = 'AIzaSyA4ZEx-_QcpBv068R7q5ytN_qH631Xwk1c';
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: "Transcribe this audio exactly as spoken, without adding any explanation or additional text." },
                                {
                                    inlineData: {
                                        mimeType: 'audio/webm', // Trying webm; may need adjustment
                                        data: base64Audio
                                    }
                                }
                            ]
                        }],
                        generationConfig: {
                            responseMimeType: 'text/plain'
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'Gemini API request failed');
                }

                const result = await response.json();
                const transcribedAddress = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
                console.log('Raw Gemini response:', transcribedAddress);

                if (transcribedAddress) {
                    const addressInputs = document.getElementsByClassName('address-input');
                    const lastInput = addressInputs[addressInputs.length - 1];
                    if (lastInput) {
                        lastInput.value = transcribedAddress;
                        lastInput.dispatchEvent(new Event('input'));
                        console.log('Address added: ' + transcribedAddress);
                    }
                } else {
                    alert('No speech detected. Please try again.');
                }
            } catch (error) {
                alert('Failed to transcribe audio: ' + error.message);
            } finally {
                stream.getTracks().forEach(track => track.stop());
            }
        };

        mediaRecorder.start();
        console.log('Recording... Speak the address now.');
        setTimeout(() => {
            if (mediaRecorder.state === 'recording') mediaRecorder.stop();
        }, 10000); // 10-second recording
    } catch (error) {
        alert('Failed to access microphone: ' + error.message);
    }
});

// Rest of your script.js remains unchanged below this point
function updateLaunchButton() {
    const launchBtn = document.getElementById('launch-btn');
    const startAddress = document.getElementById('start-address')?.value.trim() || '';
    const endAddresses = Array.from(document.getElementsByClassName('address-input') || []).map(input => input.value.trim()).filter(val => val);
    if (launchBtn) launchBtn.disabled = !startAddress || endAddresses.length < 1;
    console.log('Start Address:', startAddress, 'End Addresses:', endAddresses);
}

function initializeMap() {
    if (!map) {
        map = L.map('map').setView([13.0827, 80.2707], 13); // Default view (Chennai, India)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
    }
}

async function geocodeAddress(address) {
    console.log('Geocoding address:', address);
    const response = await fetch('/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address + ", Chennai, India" })
    });
    const data = await response.json();
    if (response.status !== 200 || data.error) throw new Error(data.error || 'Geocoding failed');
    return data.coordinates;
}

async function fetchRoute(addresses, ecoMode) {
    const allAddresses = [document.getElementById('start-address')?.value.trim() || '', ...addresses.map(addr => addr.trim())];
    console.log('Sending addresses to backend:', allAddresses);
    const coordinates = await Promise.all(allAddresses.map(geocodeAddress));
    const response = await fetch('/calculate_route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: allAddresses, ecoMode })
    });
    const data = await response.json();
    if (response.status !== 200 || data.error) throw new Error(data.error || 'Route calculation failed');
    return data;
}

document.getElementById('launch-btn')?.addEventListener('click', async () => {
    const startAddress = document.getElementById('start-address')?.value.trim() || '';
    const endAddresses = Array.from(document.getElementsByClassName('address-input') || []).map(input => input.value.trim()).filter(val => val);
    if (!startAddress || endAddresses.length < 1) {
        document.getElementById('error-message')?.classList.remove('hidden');
        document.getElementById('error-message').textContent = 'Please enter a starting point and at least one ending point.';
        return;
    }

    document.getElementById('error-message')?.classList.add('hidden');
    if (vehicleMarker) map.removeLayer(vehicleMarker);
    competitorMarkers.forEach(marker => map.removeLayer(marker));
    competitorMarkers = [];
    pins.forEach(pin => map.removeLayer(pin.marker));
    pins = [];

    try {
        const data = await fetchRoute(endAddresses, false); // EcoMode not in UI, default to false
        routeData = data;
        console.log('Route data fetched:', routeData);
        displayRoute(data);
        updateAnalytics(data);
        showCompetitorModal().then((proceed) => {
            if (proceed) {
                showCollaborationModal('competitor_1').then((proceed) => {
                    if (proceed) {
                        showNotificationModal();
                    }
                });
            }
        });
    } catch (error) {
        document.getElementById('error-message')?.classList.remove('hidden');
        document.getElementById('error-message').textContent = `Failed to calculate route: ${error.message}`;
        console.error('Route calculation error:', error);
    }
});

function displayRoute(data) {
    if (routePolyline) map.removeLayer(routePolyline);
    routeMarkers.forEach(marker => map.removeLayer(marker));
    routeMarkers = [];
    if (vehicleMarker) map.removeLayer(vehicleMarker);

    const latlngs = data.geometry.map(coord => [coord[1], coord[0]]);
    routePolyline = L.polyline(latlngs, { color: 'red', weight: 4, opacity: 0.8 }).addTo(map);

    data.locations.forEach((loc, index) => {
        const marker = L.marker([loc[1], loc[0]], { icon: L.divIcon({ className: 'custom-marker', iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(map);
        routeMarkers.push(marker);
    });
    map.fitBounds(latlngs);

    vehicleMarker = L.marker(latlngs[0], { icon: vehicleIcon }).addTo(map);
    let i = 0;
    function moveVehicle() {
        if (i < latlngs.length) {
            vehicleMarker.setLatLng(latlngs[i]);
            i++;
            setTimeout(moveVehicle, 20);
        } else {
            console.log('Vehicle animation complete');
        }
    }
    moveVehicle();
}

function updateAnalytics(data) {
    const totalDistance = data.total_distance || 0;
    const totalDuration = data.total_duration || 0; // in minutes
    const numStops = data.locations.length || 1;

    document.getElementById('total-distance').textContent = totalDistance.toFixed(2) || 'N/A';
    document.getElementById('total-co2').textContent = data.total_co2.toFixed(0) || 'N/A';
    document.getElementById('fuel-consumption').textContent = data.analytics.fuel_consumption.toFixed(2) || 'N/A';
    document.getElementById('fuel-savings').textContent = data.analytics.fuel_savings.toFixed(2) || 'N/A';
    document.getElementById('total-delivery-time').textContent = totalDuration.toFixed(1) || 'N/A';
    document.getElementById('cost-savings').textContent = data.analytics.cost_savings.toFixed(2) || 'N/A';
    document.getElementById('traffic-delay').textContent = data.analytics.traffic_impact.toFixed(1) || 'N/A';
    document.getElementById('co2-savings-vs-industry').textContent = data.analytics.co2_savings_vs_industry.toFixed(0) || 'N/A';
    document.getElementById('efficiency-score').textContent = data.analytics.efficiency_score || 'N/A';
    document.getElementById('sustainability-score').textContent = data.analytics.sustainability_score || 'N/A';
    document.getElementById('avg-delivery-time').textContent = data.analytics.avg_delivery_time.toFixed(1) || 'N/A';
    document.getElementById('driver-performance').textContent = data.analytics.driver_performance || 'N/A';
}

function showCompetitorModal() {
    return new Promise((resolve) => {
        const competitorModal = document.getElementById('competitor-modal');
        if (competitorModal && routeData) {
            console.log('Showing competitor modal');
            competitorModal.classList.remove('hidden');
            const okButton = document.getElementById('competitor-ok');
            const skipButton = document.getElementById('competitor-skip');
            okButton.onclick = () => {
                competitorModal.classList.add('hidden');
                resolve(true);
            };
            skipButton.onclick = () => {
                competitorModal.classList.add('hidden');
                resolve(false);
            };
        } else {
            resolve(false);
        }
    });
}

function showCollaborationModal(competitorId) {
    return new Promise((resolve) => {
        const collaborationModal = document.getElementById('collaboration-modal');
        if (collaborationModal && routeData) {
            console.log('Showing collaboration modal');
            collaborationModal.classList.remove('hidden');
            document.getElementById('collaboration-text').textContent = `Interested in a deal with ${competitorId} sharing this route?`;
            const proceedButton = document.getElementById('collaboration-proceed');
            const cancelButton = document.getElementById('collaboration-cancel');
            const closeButton = document.getElementById('collaboration-close');
            proceedButton.onclick = () => {
                collaborationModal.classList.add('hidden');
                resolve(true);
            };
            cancelButton.onclick = () => {
                collaborationModal.classList.add('hidden');
                resolve(false);
            };
            closeButton.onclick = () => {
                collaborationModal.classList.add('hidden');
                resolve(false);
            };
        } else {
            resolve(false);
        }
    });
}

function showNotificationModal() {
    return new Promise((resolve) => {
        const notificationModal = document.getElementById('notification-modal');
        if (notificationModal && routeData) {
            console.log('Showing notification modal');
            notificationModal.classList.remove('hidden');
            const okButton = document.getElementById('notify-ok');
            const skipButton = document.getElementById('notify-skip');
            okButton.onclick = () => {
                notificationModal.classList.add('hidden');
                resolve(true);
            };
            skipButton.onclick = () => {
                notificationModal.classList.add('hidden');
                resolve(false);
            };
        } else {
            resolve(false);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeMap();

    document.getElementById('competitor-ok').addEventListener('click', () => {
        console.log('Competitor OK clicked');
        fetch('/get_competitor_routes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geometry: routeData.geometry })
        }).then(response => response.json()).then(data => {
            data.competitor_routes.forEach(comp => {
                const latlngs = comp.geometry.map(coord => [coord[1], coord[0]]);
                L.polyline(latlngs, { color: '#ef4444', weight: 4, opacity: 0.8, dashArray: '5, 10' }).addTo(map);
                const marker = L.marker(latlngs[0], { icon: vehicleIcon }).addTo(map);
                let i = 0;
                function moveCompetitor() {
                    if (i < latlngs.length) {
                        marker.setLatLng(latlngs[i]);
                        i++;
                        setTimeout(moveCompetitor, 50);
                    }
                }
                moveCompetitor();
                competitorMarkers.push(marker);
            });
        }).catch(error => alert('Failed to fetch competitor routes: ' + error.message));
    });

    document.getElementById('competitor-skip').addEventListener('click', () => {
        console.log('Competitor Skip clicked');
    });

    document.getElementById('collaboration-proceed').addEventListener('click', () => {
        console.log('Collaboration Proceed clicked');
        const competitorId = document.getElementById('collaboration-text').textContent.match(/with (\w+)/)[1];
        window.location.href = `/collaboration_hub?competitor_id=${competitorId}`;
    });

    document.getElementById('collaboration-cancel').addEventListener('click', () => {
        console.log('Collaboration Cancel clicked');
    });

    document.getElementById('collaboration-close').addEventListener('click', () => {
        console.log('Collaboration Close clicked');
    });

    document.getElementById('notify-ok').addEventListener('click', () => {
        console.log('Notify OK clicked');
        alert('ETA notification sent to customer! (Mocked)');
    });

    document.getElementById('notify-skip').addEventListener('click', () => {
        console.log('Notify Skip clicked');
    });

    document.getElementById('reroute-btn')?.addEventListener('click', () => {
        alert('Re-routing... (Mocked)');
        document.getElementById('traffic-alert')?.classList.add('hidden');
    });

    document.getElementById('start-address')?.addEventListener('input', updateLaunchButton);
    document.getElementById('address-list')?.addEventListener('input', updateLaunchButton);

    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;
        onValue(ref(db, `routes/${userId}`), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                routeData = Object.values(data)[0];
                if (routeData) {
                    displayRoute(routeData);
                    updateAnalytics(routeData);
                    showCompetitorModal().then((proceed) => {
                        if (proceed) {
                            showCollaborationModal('competitor_1').then((proceed) => {
                                if (proceed) {
                                    showNotificationModal();
                                }
                            });
                        }
                    });
                }
            }
        });
    }
    console.log('DOM fully loaded, ready for modal triggers');
});