// document.addEventListener('DOMContentLoaded', () => {
//     // Initialize Leaflet map
//     const map = L.map('map').setView([51.505, -0.09], 13);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
//         maxZoom: 19
//     }).addTo(map);

//     // Get route data from server
//     const routeData = window.routeData || null;
//     const competitorData = window.competitorData || {};
//     let collaborationId = null;

//     if (routeData && routeData.geometry) {
//         const userGeometry = routeData.geometry.map(coord => [coord[1], coord[0]]);
//         L.polyline(userGeometry, { color: '#10b981', weight: 4, opacity: 0.8 }).addTo(map);
//         map.fitBounds(L.polyline(userGeometry).getBounds(), { padding: [50, 50] });
//     }

//     // Fetch competitor routes
//     const fetchCompetitorRoutesBtn = document.getElementById('fetchCompetitorRoutes');
//     fetchCompetitorRoutesBtn.addEventListener('click', () => {
//         fetch('/get_competitor_routes', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ geometry: routeData ? routeData.geometry : [] })
//         })
//         .then(response => response.json())
//         .then(data => {
//             if (data.error) {
//                 alert(data.error);
//                 return;
//             }
//             data.competitor_routes.forEach(route => {
//                 const competitorCoords = route.geometry.map(coord => [coord[1], coord[0]]);
//                 L.polyline(competitorCoords, { color: 'red', weight: 4, opacity: 0.6 }).addTo(map);
//             });
//             document.getElementById('collaborationForm').classList.add('active');
//         })
//         .catch(error => console.error('Error fetching competitor routes:', error));
//     });

//     // Submit collaboration
//     const submitCollaborationBtn = document.getElementById('submitCollaboration');
//     submitCollaborationBtn.addEventListener('click', () => {
//         const goods = document.getElementById('goods').value.split(',').map(g => g.trim());
//         const services = document.getElementById('services').value.trim();
//         const routes = document.getElementById('routes').value.trim() || (routeData ? routeData.addresses.join(', ') : '');
//         const ecoMode = document.getElementById('ecoModeToggle').checked;

//         if (!goods.length || !services) {
//             alert('Please enter goods and service type.');
//             return;
//         }

//         fetch('/submit_collaboration', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ goods, services, routes, competitor_id: 'competitor_1' })
//         })
//         .then(response => response.json())
//         .then(data => {
//             if (data.error) {
//                 alert(data.error);
//                 return;
//             }
//             alert(data.message);
//             collaborationId = data.collaboration_id;

//             // Show collaboration details
//             fetchCollaborationDetails(goods, routeData.total_distance, routeData.addresses);
//             document.getElementById('collaborationDetails').classList.add('active');

//             // Show chat
//             loadChatMessages(collaborationId);
//             document.getElementById('chatBox').classList.add('active');

//             // Update leaderboard
//             loadLeaderboard();
//             document.getElementById('leaderboard').classList.add('active');
//         })
//         .catch(error => console.error('Error submitting collaboration:', error));
//     });

//     // Fetch collaboration details
//     function fetchCollaborationDetails(goods, total_distance, addresses) {
//         fetch('/collaboration_details', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 goods,
//                 total_distance,
//                 addresses,
//                 geometry: routeData.geometry,
//                 competitor_id: 'competitor_1'
//             })
//         })
//         .then(response => response.json())
//         .then(data => {
//             const analyticsGrid = document.getElementById('analytics-grid');
//             analyticsGrid.innerHTML = '';
//             Object.entries(data).forEach(([key, value]) => {
//                 const card = document.createElement('div');
//                 card.className = 'analytics-card fade-in';
//                 card.textContent = `${key}: ${JSON.stringify(value)}`;
//                 analyticsGrid.appendChild(card);
//             });
//         })
//         .catch(error => console.error('Error fetching collaboration details:', error));
//     }

//     // Load chat messages
//     function loadChatMessages(collaborationId) {
//         fetch(`/get_chat_messages/${collaborationId}`)
//             .then(response => response.json())
//             .then(data => {
//                 const chatMessages = document.getElementById('chatMessages');
//                 chatMessages.innerHTML = data.messages.map(msg => 
//                     `<div class="fade-in">${msg.sender}: ${msg.message} (${new Date(msg.created_at).toLocaleTimeString()})</div>`
//                 ).join('');
//             })
//             .catch(error => console.error('Error loading chat messages:', error));
//     }

//     // Send chat message
//     const sendChatBtn = document.getElementById('sendChat');
//     sendChatBtn.addEventListener('click', () => {
//         const message = document.getElementById('chatInput').value.trim();
//         if (!message || !collaborationId) {
//             alert('Please enter a message and ensure a collaboration is active.');
//             return;
//         }
//         fetch(`/send_chat_message/${collaborationId}`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ message })
//         })
//         .then(response => response.json())
//         .then(data => {
//             document.getElementById('chatInput').value = '';
//             loadChatMessages(collaborationId);
//         })
//         .catch(error => console.error('Error sending chat message:', error));
//     });

//     // Load leaderboard
//     function loadLeaderboard() {
//         fetch('/leaderboard')
//             .then(response => response.json())
//             .then(data => {
//                 const leaderboardList = document.getElementById('leaderboardList');
//                 leaderboardList.innerHTML = data.leaderboard.map(entry => 
//                     `<div class="analytics-card fade-in">${entry.user}: ${entry.points} EcoPoints</div>`
//                 ).join('');
//             })
//             .catch(error => console.error('Error loading leaderboard:', error));
//     }

//     // Hamburger menu toggle
//     document.getElementById('hamburgerBtn').addEventListener('click', () => {
//         document.getElementById('navbarRight').style.left = "0";
//     });
//     document.getElementById('closeBtn').addEventListener('click', () => {
//         document.getElementById('navbarRight').style.left = "-100%";
//     });
// });