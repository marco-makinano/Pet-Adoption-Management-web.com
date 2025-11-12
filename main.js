// fuction.js

// --- 1. FIREBASE CONFIGURATION & INITIALIZATION ---

// YOUR FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyBh09FnPA79qpfl17nxlbkMyE8btcJo6kQ",
    authDomain: "pet-adoption-management-db.firebaseapp.com",
    projectId: "pet-adoption-management-db",
    storageBucket: "pet-adoption-management-db.firebasestorage.app",
    messagingSenderId: "901996604908",
    appId: "1:901996604908:web:e36ee15e327219fab664c9",
    measurementId: "G-KPFP90Q3S6"
};

// Initialize Firebase using the Compatibility SDK (required for the vanilla JS syntax)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Define your collection references
const petsCollection = db.collection("pets");
const adoptionRequestsCollection = db.collection("adoptionRequests");


// --- 2. GLOBAL STATE (Populated by Firebase Listeners) ---

let state = {
    pets: [], // Populated by Firestore listener
    adoptionRequests: [], // Populated by Firestore listener
    editingPet: null,
    deletePetId: null,
    selectedPet: null,
    searchTerm: "",
    filterSpecies: "all",
    filterStatus: "all",
    activeTab: 'browse'
};

// --- 3. UI Utility Functions (TOAST, DIALOGS, etc.) ---

function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    // Auto-remove after animation
    setTimeout(() => {
        toast.remove();
    }, 4000); 
}

function openDialog(dialogId, setupCallback = null) {
    const dialog = document.getElementById(dialogId);
    if (setupCallback) {
        setupCallback();
    }
    dialog.classList.remove('hidden');
}

function closeDialog(dialogId) {
    document.getElementById(dialogId).classList.add('hidden');
    // Reset state for closed dialogs
    if (dialogId === 'add-pet-dialog') {
        state.editingPet = null;
    } else if (dialogId === 'delete-confirm-dialog') {
        state.deletePetId = null;
    } else if (dialogId === 'pet-details-dialog' || dialogId === 'adoption-request-dialog') {
        state.selectedPet = null;
    }
}

// --- 4. FIREBASE CRUD OPERATIONS (REPLACING LOCAL STORAGE) ---

function getFilteredPets() {
    const term = state.searchTerm.toLowerCase();
    
    return state.pets.filter(pet => {
        const matchesSearch = pet.name.toLowerCase().includes(term) || pet.breed.toLowerCase().includes(term);
        const matchesSpecies = state.filterSpecies === "all" || pet.species === state.filterSpecies;
        
        let matchesStatus;
        if (state.activeTab === 'manage') {
            matchesStatus = state.filterStatus === "all" || pet.status === state.filterStatus;
        } else { // 'browse' tab only shows 'available'
            matchesStatus = pet.status === 'available';
        }
        
        return matchesSearch && matchesSpecies && matchesStatus;
    });
}

// ASYNC: Communicates with Firestore
async function handleAddEditPet(event) {
    event.preventDefault();
    
    const form = event.target;
    const petData = {
        name: form.elements['pet-name'].value,
        species: form.elements['pet-species'].value,
        breed: document.getElementById('pet-breed').value, 
        age: parseInt(document.getElementById('pet-age').value),
        gender: document.getElementById('pet-gender').value,
        imageUrl: document.getElementById('pet-imageurl').value,
        description: document.getElementById('pet-description').value,
        dateAdded: document.getElementById('pet-dateadded').value || new Date().toISOString().split('T')[0],
        medicalHistory: document.getElementById('pet-medicalhistory').value,
        vaccinated: document.getElementById('pet-vaccinated').value,
        status: document.getElementById('pet-status').value || 'available',
    };

    try {
        if (state.editingPet) {
            // EDIT: Update the existing document by its Firestore ID (state.editingPet.id)
            await petsCollection.doc(state.editingPet.id).update(petData);
            showToast("Pet updated successfully");
            state.editingPet = null;
        } else {
            // ADD: Add a new document
            await petsCollection.add(petData);
            showToast("Pet added successfully");
        }
        closeDialog('add-pet-dialog');
    } catch (error) {
        console.error("Error adding/editing pet:", error);
        showToast("Error saving pet data.");
    }
}

// ASYNC: Communicates with Firestore
async function handleDeletePet(id) {
    try {
        // DELETE: Delete the document by its Firestore ID
        await petsCollection.doc(id).delete();
        
        closeDialog('delete-confirm-dialog');
        showToast("Pet deleted successfully");
    } catch (error) {
        console.error("Error deleting pet:", error);
        showToast("Error deleting pet.");
    }
}

// ASYNC: Communicates with Firestore
async function handleAdoptionRequest(event) {
    event.preventDefault();

    const form = event.target;
    const petId = form.elements['adopt-pet-id'].value;
    const petName = form.elements['adopt-pet-original-name'].value;

    const requestData = {
        petId: petId,
        petName: petName,
        fullName: form.elements['applicant-name'].value,
        email: document.getElementById('applicant-email').value,
        phone: document.getElementById('applicant-phone').value,
        address: document.getElementById('applicant-address').value,
        housingType: document.getElementById('applicant-housing').value,
        hasYard: document.getElementById('applicant-has-yard').checked,
        hasPets: document.getElementById('applicant-has-pets').value,
        experience: document.getElementById('applicant-experience').value,
        reason: document.getElementById('applicant-reason').value,
        date: new Date().toISOString().split('T')[0],
        status: "pending"
    };

    try {
        // 1. Add the new request
        await adoptionRequestsCollection.add(requestData);
        
        // 2. Update the pet status to 'pending'
        await petsCollection.doc(petId).update({ status: "pending" });

        closeDialog('adoption-request-dialog');
        showToast("Adoption request submitted successfully! We'll contact you soon.");
    } catch (error) {
        console.error("Error submitting adoption request:", error);
        showToast("Error submitting adoption request.");
    }
}

// ASYNC: Communicates with Firestore
async function handleUpdateRequestStatus(requestId, status) {
    const request = state.adoptionRequests.find(r => r.id === requestId);
    if (!request) return;
    
    const petId = request.petId;
    let newPetStatus = 'available';

    if (status === 'approved') {
        newPetStatus = 'adopted';
    } else if (status === 'rejected') {
        newPetStatus = 'available'; 
    }

    try {
        // 1. Update the request status
        await adoptionRequestsCollection.doc(requestId).update({ status: status });

        // 2. Update the pet status
        await petsCollection.doc(petId).update({ status: newPetStatus });

        showToast(`Adoption request ${status} successfully!`);
    } catch (error) {
        console.error("Error updating request status:", error);
        showToast("Error updating request status.");
    }
}

// --- 5. FIREBASE REAL-TIME LISTENERS (Replaced loadState/saveState) ---

function startFirebaseListeners() {
    // 5a. Listener for Pets
    petsCollection.onSnapshot(snapshot => {
        const petsData = [];
        snapshot.forEach(doc => {
            // Must include the Firestore document ID as 'id'
            petsData.push({ id: doc.id, ...doc.data() });
        });
        state.pets = petsData;
        
        // Re-render UI based on new data
        renderTabsContent(); 
    }, error => {
        console.error("Error listening to pets collection:", error);
        showToast("Error loading pet data.");
    });

    // 5b. Listener for Adoption Requests
    adoptionRequestsCollection.onSnapshot(snapshot => {
        const requestsData = [];
        snapshot.forEach(doc => {
            // Must include the Firestore document ID as 'id'
            requestsData.push({ id: doc.id, ...doc.data() });
        });
        state.adoptionRequests = requestsData;

        // Re-render UI based on new data
        if (state.activeTab === 'requests' || state.activeTab === 'dashboard') {
            renderRequestsTab();
            renderDashboardTab();
        }
    }, error => {
        console.error("Error listening to requests collection:", error);
    });
}


// --- 6. RENDERING FUNCTIONS (No functional changes needed) ---

function getStatusBadge(status) {
    let styleClass = 'badge-secondary';
    if (status === 'available') styleClass = 'badge-default bg-green-500 hover:bg-green-600';
    if (status === 'adopted') styleClass = 'badge-secondary';
    if (status === 'pending') styleClass = 'badge-destructive bg-yellow-500 hover:bg-yellow-600';

    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="badge ${styleClass}">${statusText}</span>`;
}

function createPetCard(pet, showActions = true) {
    const card = document.createElement('div');
    card.className = 'border rounded-lg shadow-sm overflow-hidden';
    
    let actionsHtml = '';
    if (showActions) {
        actionsHtml = `
            <div class="flex gap-2 p-4">
                <button data-pet-id="${pet.id}" class="button button-secondary flex-1 view-details-btn">View Details</button>
                ${pet.status === 'available' ? 
                    `<button data-pet-id="${pet.id}" class="button button-primary flex-1 adopt-btn">Adopt</button>` :
                    `<button class="button button-secondary flex-1" disabled>${pet.status.charAt(0).toUpperCase() + pet.status.slice(1)}</button>`
                }
            </div>
        `;
    } else {
         actionsHtml = `
            <div class="flex gap-2 mt-3">
                <button data-pet-id="${pet.id}" class="button button-secondary flex-1 edit-btn">
                    <i data-lucide="edit" class="w-4 h-4 mr-2"></i>Edit
                </button>
                <button data-pet-id="${pet.id}" class="button button-danger flex-1 delete-btn">
                    <i data-lucide="trash-2" class="w-4 h-4 mr-2"></i>Delete
                </button>
            </div>
        `;
    }

    card.innerHTML = `
        <img src="${pet.imageUrl}" alt="${pet.name}" class="w-full h-48 object-cover">
        <div class="p-4">
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-bold">${pet.name}</h3>
                ${getStatusBadge(pet.status)}
            </div>
            <p class="text-sm text-gray-500">${pet.species} - ${pet.breed}</p>
            <p class="text-sm text-gray-700 mt-2 line-clamp-2">${pet.description}</p>
            <div class="mt-4">
                ${showActions ? actionsHtml : ''}
                ${!showActions ? actionsHtml : ''}
            </div>
        </div>
    `;

    // Attach event listeners for dynamic actions (view, adopt, edit, delete)
    if (showActions) {
        card.querySelector('.view-details-btn').addEventListener('click', () => {
            state.selectedPet = pet;
            renderPetDetailsDialog();
            openDialog('pet-details-dialog');
        });
        if (pet.status === 'available') {
            card.querySelector('.adopt-btn').addEventListener('click', () => {
                state.selectedPet = pet;
                renderAdoptionRequestDialog();
                openDialog('adoption-request-dialog');
            });
        }
    } else {
        card.querySelector('.edit-btn').addEventListener('click', () => {
            state.editingPet = pet;
            renderAddEditPetDialog();
            openDialog('add-pet-dialog');
        });
        card.querySelector('.delete-btn').addEventListener('click', () => {
            state.deletePetId = pet.id;
            openDialog('delete-confirm-dialog', () => {
                document.getElementById('confirm-delete-btn').onclick = () => handleDeletePet(state.deletePetId);
            });
        });
    }

    return card;
}

function renderBrowseTab() {
    const petGrid = document.getElementById('pet-grid-browse');
    const noPetsDiv = document.getElementById('no-pets-browse');
    petGrid.innerHTML = '';

    const availablePets = getFilteredPets().filter(p => p.status === 'available');

    if (availablePets.length === 0) {
        noPetsDiv.classList.remove('hidden');
    } else {
        noPetsDiv.classList.add('hidden');
        availablePets.forEach(pet => {
            petGrid.appendChild(createPetCard(pet));
        });
    }
}

function renderManageTab() {
    const petGrid = document.getElementById('pet-grid-manage');
    const noPetsDiv = document.getElementById('no-pets-manage');
    petGrid.innerHTML = '';

    const allFilteredPets = getFilteredPets();

    if (allFilteredPets.length === 0) {
        noPetsDiv.classList.remove('hidden');
    } else {
        noPetsDiv.classList.add('hidden');
        allFilteredPets.forEach(pet => {
            petGrid.appendChild(createPetCard(pet, false));
        });
    }
    // Re-render icons for dynamically added content
    lucide.createIcons(); 
}

function renderRequestsTab() {
    const tableContainer = document.getElementById('requests-table-container');
    const noRequestsDiv = document.getElementById('no-requests');
    
    if (state.adoptionRequests.length === 0) {
        tableContainer.innerHTML = '';
        noRequestsDiv.classList.remove('hidden');
        return;
    }
    noRequestsDiv.classList.add('hidden');

    const tableHtml = `
        <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b">
                <tr>
                    <th class="p-4 text-left font-medium">Date</th>
                    <th class="p-4 text-left font-medium">Applicant</th>
                    <th class="p-4 text-left font-medium">Pet</th>
                    <th class="p-4 text-left font-medium">Contact</th>
                    <th class="p-4 text-left font-medium">Housing</th>
                    <th class="p-4 text-left font-medium">Status</th>
                    <th class="p-4 text-left font-medium">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${state.adoptionRequests.map(request => {
                    const statusBadge = getStatusBadge(request.status);
                    const actions = request.status === 'pending' ? `
                        <div class="flex gap-2">
                            <button onclick="handleUpdateRequestStatus('${request.id}', 'approved')" class="button button-primary" style="padding: 0.25rem 0.5rem;">Approve</button>
                            <button onclick="handleUpdateRequestStatus('${request.id}', 'rejected')" class="button button-secondary" style="padding: 0.25rem 0.5rem;">Reject</button>
                        </div>
                    ` : '';
                    
                    const hasYardText = request.hasYard ? '<div class="text-xs text-gray-500">Has yard</div>' : '';

                    return `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-4">${new Date(request.date).toLocaleDateString()}</td>
                            <td class="p-4">
                                <div>${request.fullName}</div>
                                <div class="text-xs text-gray-500">${request.email}</div>
                            </td>
                            <td class="p-4">${request.petName}</td>
                            <td class="p-4">${request.phone}</td>
                            <td class="p-4">
                                <div>${request.housingType}</div>
                                ${hasYardText}
                            </td>
                            <td class="p-4">${statusBadge}</td>
                            <td class="p-4">${actions}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    tableContainer.innerHTML = tableHtml;
}

function renderDashboardTab() {
    const totalPets = state.pets.length;
    const availablePetsCount = state.pets.filter(p => p.status === 'available').length;
    const pendingRequestsCount = state.adoptionRequests.filter(r => r.status === 'pending').length;

    // Update summary
    document.getElementById('dashboard-total-pets').textContent = totalPets;
    document.getElementById('dashboard-available-pets').textContent = availablePetsCount;
    document.getElementById('dashboard-pending-requests').textContent = pendingRequestsCount;

    // Pet Status Breakdown
    const statusCounts = state.pets.reduce((acc, pet) => {
        acc[pet.status] = (acc[pet.status] || 0) + 1;
        return acc;
    }, {});

    const statusList = document.getElementById('dashboard-status-list');
    statusList.innerHTML = Object.entries(statusCounts).map(([status, count]) => `
        <li class="flex justify-between p-2 border rounded-md bg-white">
            <span class="font-medium">${status.charAt(0).toUpperCase() + status.slice(1)}:</span>
            <span>${count} pets</span>
        </li>
    `).join('');

    // Recent Requests (last 3)
    const recentRequestsContainer = document.getElementById('dashboard-recent-requests');
    const recentRequests = state.adoptionRequests
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    if (recentRequests.length === 0) {
        recentRequestsContainer.innerHTML = '<p class="text-gray-500">No recent requests.</p>';
    } else {
        recentRequestsContainer.innerHTML = `
            <ul class="space-y-3">
                ${recentRequests.map(req => `
                    <li class="p-3 border rounded-md bg-white flex justify-between items-center">
                        <div>
                            <span class="font-medium">${req.fullName}</span> applied for <span class="font-medium text-indigo-600">${req.petName}</span>
                            <div class="text-xs text-gray-500">${new Date(req.date).toLocaleDateString()}</div>
                        </div>
                        ${getStatusBadge(req.status)}
                    </li>
                `).join('')}
            </ul>
        `;
    }
}

function renderAddEditPetDialog() {
    const isEditing = !!state.editingPet;
    const pet = state.editingPet || {};

    document.getElementById('add-edit-pet-title').textContent = isEditing ? 'Edit Pet' : 'Add New Pet';
    
    // Populate form fields
    document.getElementById('pet-id').value = pet.id || '';
    document.getElementById('pet-name').value = pet.name || '';
    document.getElementById('pet-species').value = pet.species || '';
    document.getElementById('pet-breed').value = pet.breed || '';
    document.getElementById('pet-age').value = pet.age || '';
    document.getElementById('pet-gender').value = pet.gender || '';
    document.getElementById('pet-imageurl').value = pet.imageUrl || '';
    document.getElementById('pet-description').value = pet.description || '';
    document.getElementById('pet-status').value = pet.status || 'available';
    document.getElementById('pet-dateadded').value = pet.dateAdded || new Date().toISOString().split('T')[0];
    document.getElementById('pet-medicalhistory').value = pet.medicalHistory || '';
    document.getElementById('pet-vaccinated').value = pet.vaccinated || 'No';
}

function renderAdoptionRequestDialog() {
    const pet = state.selectedPet;
    if (!pet) return;

    document.getElementById('adopt-pet-name').textContent = pet.name;
    document.getElementById('adopt-pet-id').value = pet.id;
    document.getElementById('adopt-pet-original-name').value = pet.name;
    
    // Clear the form
    document.getElementById('adoption-request-form').reset();
}

function renderPetDetailsDialog() {
    const pet = state.selectedPet;
    if (!pet) return;

    const content = document.getElementById('pet-details-content');
    
    content.innerHTML = `
        <h3 class="text-2xl font-bold" id="detail-name">${pet.name}</h3>
        <img src="${pet.imageUrl}" alt="${pet.name}" class="w-full h-64 object-cover rounded-lg mb-4">
        <div class="grid grid-cols-2 gap-y-2">
            <span class="font-medium">Species:</span> <span>${pet.species}</span>
            <span class="font-medium">Breed:</span> <span>${pet.breed}</span>
            <span class="font-medium">Age:</span> <span>${pet.age} years</span>
            <span class="font-medium">Gender:</span> <span>${pet.gender}</span>
            <span class="font-medium">Status:</span> <span>${getStatusBadge(pet.status)}</span>
            <span class="font-medium">Vaccinated:</span> <span>${pet.vaccinated}</span>
            <span class="font-medium">Date Added:</span> <span>${new Date(pet.dateAdded).toLocaleDateString()}</span>
        </div>
        <div class="mt-4">
            <p class="font-medium mb-1">Description:</p>
            <p class="text-gray-700">${pet.description}</p>
        </div>
        <div class="mt-4">
            <p class="font-medium mb-1">Medical History:</p>
            <p class="text-gray-700">${pet.medicalHistory}</p>
        </div>
    `;
    // Re-render icons
    lucide.createIcons();
}


// --- Main Rendering and Initialization ---

function renderTabsContent() {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    const activeContent = document.querySelector(`[data-tab-content="${state.activeTab}"]`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }

    // Set active tab button style
    document.querySelectorAll('.tab-trigger').forEach(btn => {
        if (btn.dataset.tab === state.activeTab) {
            btn.setAttribute('aria-selected', 'true');
        } else {
            btn.removeAttribute('aria-selected');
        }
    });

    // Render the specific content based on the active tab
    if (state.activeTab === 'browse') {
        renderBrowseTab();
    } else if (state.activeTab === 'manage') {
        renderManageTab();
    } else if (state.activeTab === 'requests') {
        renderRequestsTab();
    } else if (state.activeTab === 'dashboard') {
        renderDashboardTab();
    }
}

function attachGlobalEventListeners() {
    // Tabs Navigation
    document.querySelectorAll('.tab-trigger').forEach(button => {
        button.addEventListener('click', () => {
            state.activeTab = button.dataset.tab;
            
            if (state.activeTab === 'browse' || state.activeTab === 'manage') {
                state.searchTerm = (state.activeTab === 'browse' ? document.getElementById('browse-search') : document.getElementById('manage-search')).value;
                state.filterSpecies = (state.activeTab === 'browse' ? document.getElementById('browse-filter-species') : document.getElementById('manage-filter-species')).value;
                if (state.activeTab === 'manage') {
                    state.filterStatus = document.getElementById('manage-filter-status').value;
                }
            } else {
                state.searchTerm = '';
                state.filterSpecies = 'all';
                state.filterStatus = 'all';
                
                // Reset search/filter inputs when leaving browse/manage
                if (document.getElementById('browse-search')) document.getElementById('browse-search').value = '';
                if (document.getElementById('manage-search')) document.getElementById('manage-search').value = '';
                if (document.getElementById('browse-filter-species')) document.getElementById('browse-filter-species').value = 'all';
                if (document.getElementById('manage-filter-species')) document.getElementById('manage-filter-species').value = 'all';
                if (document.getElementById('manage-filter-status')) document.getElementById('manage-filter-status').value = 'all';
            }
            renderTabsContent();
        });
    });

    // Filtering/Searching for Browse and Manage tabs
    document.getElementById('browse-search').addEventListener('input', (e) => { state.searchTerm = e.target.value; renderBrowseTab(); });
    document.getElementById('browse-filter-species').addEventListener('change', (e) => { state.filterSpecies = e.target.value; renderBrowseTab(); });

    document.getElementById('manage-search').addEventListener('input', (e) => { state.searchTerm = e.target.value; renderManageTab(); });
    document.getElementById('manage-filter-species').addEventListener('change', (e) => { state.filterSpecies = e.target.value; renderManageTab(); });
    document.getElementById('manage-filter-status').addEventListener('change', (e) => { state.filterStatus = e.target.value; renderManageTab(); });
    
    // Add Pet Button
    document.getElementById('add-pet-btn').addEventListener('click', () => {
        state.editingPet = null;
        renderAddEditPetDialog();
        openDialog('add-pet-dialog');
    });

    // Form Submission Handlers
    document.getElementById('add-edit-pet-form').addEventListener('submit', handleAddEditPet);
    document.getElementById('adoption-request-form').addEventListener('submit', handleAdoptionRequest);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Inject missing form fields for a complete setup
    function injectMissingFormFields() {
        const petForm = document.getElementById('add-edit-pet-form');
        const speciesSelect = petForm.querySelector('#pet-species');
        // Ensure we only inject if the fields aren't already there (e.g., check if pet-breed exists)
        if (!document.getElementById('pet-breed')) {
            speciesSelect.insertAdjacentHTML('afterend', `
                <div class="space-y-2"><label for="pet-breed" class="label">Breed</label><input type="text" id="pet-breed" required class="input"></div>
                <div class="space-y-2"><label for="pet-age" class="label">Age</label><input type="number" id="pet-age" required class="input"></div>
                <div class="space-y-2"><label for="pet-gender" class="label">Gender</label>
                    <select id="pet-gender" required class="select"><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option></select>
                </div>
                <div class="space-y-2"><label for="pet-status" class="label">Status</label>
                    <select id="pet-status" required class="select"><option value="available">Available</option><option value="pending">Pending</option><option value="adopted">Adopted</option></select>
                </div>
                <div class="space-y-2"><label for="pet-imageurl" class="label">Image URL</label><input type="url" id="pet-imageurl" required class="input"></div>
                <div class="space-y-2"><label for="pet-description" class="label">Description</label><textarea id="pet-description" required class="input h-20"></textarea></div>
                <div class="space-y-2"><label for="pet-dateadded" class="label">Date Added</label><input type="date" id="pet-dateadded" required class="input"></div>
                <div class="space-y-2"><label for="pet-medicalhistory" class="label">Medical History</label><textarea id="pet-medicalhistory" required class="input h-20"></textarea></div>
                <div class="space-y-2"><label for="pet-vaccinated" class="label">Vaccinated</label>
                    <select id="pet-vaccinated" required class="select"><option value="Yes">Yes</option><option value="No">No</option><option value="N/A">N/A</option></select>
                </div>
            `);
        }
        
        const adoptForm = document.getElementById('adoption-request-form');
        const applicantNameInput = adoptForm.querySelector('#applicant-name');
        // Check if the extra fields for adoption form are missing
        if (!document.getElementById('applicant-email')) {
            applicantNameInput.closest('.space-y-2').insertAdjacentHTML('afterend', `
                <div class="space-y-2"><label for="applicant-email" class="label">Email</label><input type="email" id="applicant-email" required class="input"></div>
                <div class="space-y-2"><label for="applicant-phone" class="label">Phone</label><input type="tel" id="applicant-phone" required class="input"></div>
                <div class="space-y-2"><label for="applicant-address" class="label">Address</label><input type="text" id="applicant-address" required class="input"></div>
                <div class="space-y-2"><label for="applicant-housing" class="label">Housing Type</label>
                    <select id="applicant-housing" required class="select"><option value="">Select Type</option><option value="House">House</option><option value="Apartment">Apartment</option><option value="Condo">Condo</option></select>
                </div>
                <div class="space-y-2 flex items-center gap-2">
                    <input type="checkbox" id="applicant-has-yard" class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                    <label for="applicant-has-yard" class="label mb-0">Do you have a secure yard?</label>
                </div>
                <div class="space-y-2"><label for="applicant-has-pets" class="label">Other Pets in Home</label><input type="text" id="applicant-has-pets" required class="input" placeholder="e.g., No, Yes - Cats, Yes - Dogs"></div>
                <div class="space-y-2"><label for="applicant-experience" class="label">Pet Ownership Experience</label><textarea id="applicant-experience" required class="input h-20"></textarea></div>
                <div class="space-y-2"><label for="applicant-reason" class="label">Reason for Adoption</label><textarea id="applicant-reason" required class="input h-20"></textarea></div>
            `);
        }
    }
    
    injectMissingFormFields();
    
    // START FIREBASE LISTENERS (Fetches data and populates state)
    startFirebaseListeners();
    
    attachGlobalEventListeners();
    document.querySelector('.tab-trigger[data-default="true"]').setAttribute('aria-selected', 'true');
    // Initial render is now driven by the listeners.
});

// Inside startFirebaseListeners() - Section 5b

    adoptionRequestsCollection.onSnapshot(snapshot => {
        const requestsData = [];
        snapshot.forEach(doc => {
            requestsData.push({ id: doc.id, ...doc.data() });
        });
        state.adoptionRequests = requestsData;

        // Ensure this line runs every time data changes!
        renderTabsContent(); 
        
    }, error => {
        // Check your browser console for this error!
        console.error("Error listening to requests collection:", error);
    });
