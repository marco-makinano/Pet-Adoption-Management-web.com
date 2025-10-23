// Storage functions
function savePetsToStorage(petsData) {
    localStorage.setItem('pets', JSON.stringify(petsData));
}

function getPetsFromStorage() {
    const storedPets = localStorage.getItem('pets');
    return storedPets ? JSON.parse(storedPets) : null;
}

// Initial pet data
const initialPets = [
    {
        id: "1",
        name: "Max",
        breed: "Golden Retriever",
        age: 3,
        status: "Available",
        location: "Pasig City, Pinagbuhatan",
        description: "Friendly and energetic, loves to play fetch",
        type: "Dog"
    },
    {
        id: "2",
        name: "Luna",
        breed: "Siamese Cat",
        age: 2,
        status: "Available",
        location: "Pasig City, Manggahan",
        description: "Calm and affectionate, perfect lap cat",
        type: "Cat"
    },
    {
        id: "3",
        name: "Charlie",
        breed: "Beagle",
        age: 4,
        status: "Pending Adoption",
        location: "Pasig City, Capital Common",
        description: "Great with kids, loves outdoor adventures",
        type: "Dog"
    },
    {
        id: "4",
        name: "Bella",
        breed: "Persian Cat",
        age: 1,
        status: "Pending Adoption",
        location: "Pasig City, Bagong Ilog",
        description: "Gentle and quiet, enjoys cozy spaces",
        type: "Cat"
    },
    {
        id: "5",
        name: "Rocky",
        breed: "German Shepherd",
        age: 5,
        status: "Adopted",
        location: "Pasig City, Sta.Rosa",
        description: "Loyal and protective, well-trained",
        type: "Dog"
    },
    {
        id: "6",
        name: "Daisy",
        breed: "Labrador Retriever",
        age: 2,
        status: "Available",
        location: "Pasig City, Bagong Katipunan",
        description: "Playful and social, loves swimming",
        type: "Dog"
    },
    {
        id: "7",
        name: "Milo",
        breed: "Tabby Cat",
        age: 3,
        status: "Available",
        location: "Pasig City, Buting",
        description: "Curious and independent, good mouser",
        type: "Cat"
    },
    {
        id: "8",
        name: "Cooper",
        breed: "Poodle",
        age: 4,
        status: "Adopted",
        location: "Pasig City, Bambang",
        description: "Intelligent and hypoallergenic",
        type: "Dog"
    }
];

// Initialize pets data
let pets = getPetsFromStorage() || initialPets;
if (!getPetsFromStorage()) {
    savePetsToStorage(pets);
}

let currentRole = "user";

// Toast notification system
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s ease-out reverse";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Get status icon SVG
function getStatusIcon(status) {
    if (status === "Available") {
        return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    } else if (status === "Pending Adoption") {
        return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
    } else {
        return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    }
}

// Create pet card HTML
function createPetCard(pet, actions = "") {
    const statusClass = pet.status.toLowerCase().replace(" ", "-");
    return `
        <div class="pet-card">
            <div class="pet-card-header">
                <h3>${pet.name}</h3>
                <span class="status-badge ${statusClass}">
                    ${getStatusIcon(pet.status)}
                    ${pet.status}
                </span>
            </div>
            <div class="pet-info">
                <div class="pet-info-item">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    ${pet.type}
                </div>
                <div class="pet-info-item">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${pet.location}
                </div>
                <div class="pet-info-item">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                    </svg>
                    ${pet.breed} • ${pet.age} year${pet.age !== 1 ? 's' : ''} old
                </div>
            </div>
            ${pet.description ? `<p class="pet-description">${pet.description}</p>` : ''}
            ${actions}
        </div>
    `;
}

// Update pet status
function updatePetStatus(petId, newStatus) {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
        pet.status = newStatus;
        savePetsToStorage(pets);
        renderCurrentInterface();
    }
}

// Delete pet
function deletePet(petId) {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
        pets = pets.filter(p => p.id !== petId);
        savePetsToStorage(pets);
        showToast(`${pet.name} has been removed from the system`);
        renderCurrentInterface();
    }
}

// Add new pet
function addPet(petData) {
    const newPet = {
        id: Date.now().toString(),
        ...petData
    };
    pets.push(newPet);
    savePetsToStorage(pets);
    showToast(`${newPet.name} has been added successfully!`);
    renderCurrentInterface();
}

// Render User Interface
function renderUserInterface() {
    const container = document.getElementById("user-pets-grid");
    const searchQuery = document.getElementById("search-input").value.toLowerCase();
    const typeFilter = document.getElementById("type-filter").value;

    // Filter pets
    const filteredPets = pets.filter(pet => {
        const matchesStatus = pet.status === "Available";
        const matchesSearch = pet.name.toLowerCase().includes(searchQuery) || 
                            pet.breed.toLowerCase().includes(searchQuery);
        const matchesType = !typeFilter || pet.type === typeFilter;
        return matchesStatus && matchesSearch && matchesType;
    });

    if (filteredPets.length === 0) {
        container.innerHTML = '<div class="empty-state">No pets found matching your criteria</div>';
        return;
    }

    container.innerHTML = filteredPets.map(pet => {
        const actions = `
            <div class="pet-actions">
                <button class="btn btn-primary" onclick="adoptPet('${pet.id}')">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    Adopt Me
                </button>
            </div>
        `;
        return createPetCard(pet, actions);
    }).join("");
}

// Render Employee Interface
function renderEmployeeInterface() {
    const container = document.getElementById("employee-pets-grid");
    const pendingPets = pets.filter(pet => pet.status === "Pending Adoption");

    if (pendingPets.length === 0) {
        container.innerHTML = '<div class="empty-state">No pending adoption applications at this time</div>';
        return;
    }

    container.innerHTML = pendingPets.map(pet => {
        const actions = `
            <div class="pet-actions">
                <button class="btn btn-success" onclick="approvePet('${pet.id}')">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Approve
                </button>
                <button class="btn btn-danger" onclick="rejectPet('${pet.id}')">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Reject
                </button>
            </div>
        `;
        return createPetCard(pet, actions);
    }).join("");
}

// Render Admin Interface
function renderAdminInterface() {
    const container = document.getElementById("admin-pets-grid");

    if (pets.length === 0) {
        container.innerHTML = '<div class="empty-state">No pets in the system</div>';
        return;
    }

    container.innerHTML = pets.map(pet => {
        const actions = `
            <div class="pet-actions">
                <button class="btn btn-danger" onclick="deletePet('${pet.id}')">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Remove Pet
                </button>
            </div>
        `;
        return createPetCard(pet, actions);
    }).join("");
}

// Render current interface based on role
function renderCurrentInterface() {
    if (currentRole === "user") {
        renderUserInterface();
    } else if (currentRole === "employee") {
        renderEmployeeInterface();
    } else if (currentRole === "admin") {
        renderAdminInterface();
    }
}

// Switch role
function switchRole(role) {
    currentRole = role;

    // Update active button
    document.querySelectorAll(".role-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.role === role) {
            btn.classList.add("active");
        }
    });

    // Show/hide interfaces
    document.querySelectorAll(".interface").forEach(iface => {
        iface.classList.remove("active");
    });
    document.getElementById(`${role}-interface`).classList.add("active");

    renderCurrentInterface();
}

// User actions
function adoptPet(petId) {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
        updatePetStatus(petId, "Pending Adoption");
        showToast(`Adoption request submitted for ${pet.name}!`);
    }
}

// Employee actions
function approvePet(petId) {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
        updatePetStatus(petId, "Adopted");
        showToast(`${pet.name}'s adoption has been approved!`);
    }
}

function rejectPet(petId) {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
        updatePetStatus(petId, "Available");
        showToast(`${pet.name}'s application has been rejected`, "info");
    }
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
    // Role selector buttons
    document.querySelectorAll(".role-btn").forEach(btn => {
        btn.addEventListener("click", () => switchRole(btn.dataset.role));
    });

    // Search and filter
    document.getElementById("search-input").addEventListener("input", () => {
        if (currentRole === "user") renderUserInterface();
    });

    document.getElementById("type-filter").addEventListener("change", () => {
        if (currentRole === "user") renderUserInterface();
    });

    // Add pet form
    document.getElementById("add-pet-form").addEventListener("submit", (e) => {
        e.preventDefault();

        const petData = {
            name: document.getElementById("pet-name").value,
            breed: document.getElementById("pet-breed").value,
            age: parseInt(document.getElementById("pet-age").value),
            status: document.getElementById("pet-status").value,
            type: document.getElementById("pet-type").value,
            location: document.getElementById("pet-location").value,
            description: document.getElementById("pet-description").value
        };

        addPet(petData);

        // Reset form
        e.target.reset();
    });

    // Initial render
    renderUserInterface();
});
