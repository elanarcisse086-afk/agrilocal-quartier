// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAkBu3QibIF0fjKQ3qz_2Xr2lMYT_S2g4g",
    authDomain: "agrilocal-quartier.firebaseapp.com",
    projectId: "agrilocal-quartier",
    storageBucket: "agrilocal-quartier.firebasestorage.app",
    messagingSenderId: "385086582928",
    appId: "1:385086582928:web:ad0ec6a85783d3aa70a815"
};

// Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let allProducts = [];
let currentCategory = "all";

// ============ 5 PRODUITS PAR DÉFAUT ============
const defaultProducts = [
    { name: "Tomates fraîches", category: "légume", description: "Tomates bien mûres du jardin", price: 500, unit: "kg", quantity: 30, seller: "Maman Odile", phone: "691234567", password: "tomate123", photo: null, createdAt: new Date().toISOString() },
    { name: "Manioc", category: "tubercule", description: "Manioc frais, qualité bâton", price: 350, unit: "kg", quantity: 100, seller: "Papa Jean", phone: "698765432", password: "manioc123", photo: null, createdAt: new Date().toISOString() },
    { name: "Plantain mûr", category: "fruit", description: "Plantain bien mûr pour beignets", price: 450, unit: "kg", quantity: 25, seller: "Mama Rose", phone: "697112233", password: "plantain123", photo: null, createdAt: new Date().toISOString() },
    { name: "Piments frais", category: "épice", description: "Piments forts", price: 200, unit: "100g", quantity: 15, seller: "Maman Odile", phone: "691234567", password: "piment123", photo: null, createdAt: new Date().toISOString() },
    { name: "Feuilles de manioc", category: "herbe", description: "Feuilles fraîches pour kwem", price: 300, unit: "botte", quantity: 20, seller: "Mama Clarisse", phone: "699887766", password: "feuille123", photo: null, createdAt: new Date().toISOString() }
];

async function initDefaultProducts() {
    const snapshot = await getDocs(collection(db, 'products'));
    if (snapshot.empty) {
        for (const product of defaultProducts) {
            await addDoc(collection(db, 'products'), product);
        }
        console.log("✅ 5 produits par défaut ajoutés !");
    }
}

// ============ FONCTIONS PRINCIPALES ============

// Aperçu photo
document.getElementById('productPhoto')?.addEventListener('change', function(e) {
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = '';
    if (e.target.files[0]) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(e.target.files[0]);
        preview.appendChild(img);
    }
});

// Ajouter un produit
document.getElementById('productForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
        let photoURL = null;
        const photoFile = document.getElementById('productPhoto')?.files[0];
        if (photoFile) {
            const storageRef = ref(storage, `products/${Date.now()}_${photoFile.name}`);
            await uploadBytes(storageRef, photoFile);
            photoURL = await getDownloadURL(storageRef);
        }
        
        const newProduct = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            description: document.getElementById('productDesc').value || "",
            price: parseInt(document.getElementById('productPrice').value),
            unit: document.getElementById('productUnit').value,
            quantity: parseInt(document.getElementById('productQuantity').value),
            seller: document.getElementById('productSeller').value,
            phone: document.getElementById('productPhone').value,
            password: document.getElementById('productPassword').value,
            photo: photoURL,
            createdAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, 'products'), newProduct);
        document.getElementById('productForm').reset();
        document.getElementById('photoPreview').innerHTML = '';
        document.getElementById('addModal').style.display = 'none';
        alert('✅ Produit ajouté avec succès !');
    } catch (error) {
        console.error(error);
        alert("Erreur: " + error.message);
    }
});

// Afficher les produits
function displayProducts(products) {
    const container = document.getElementById('productsList');
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || "";
    
    let filtered = products.filter(p => {
        const matchCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchSearch = p.name.toLowerCase().includes(searchTerm) || (p.seller && p.seller.toLowerCase().includes(searchTerm));
        return matchCategory && matchSearch;
    });
    
    document.getElementById('productCount').innerText = `${filtered.length} produit${filtered.length > 1 ? 's' : ''}`;
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-results">😕 Aucun produit trouvé<br>Clique sur + pour ajouter le tien</div>';
        return;
    }
    
    container.innerHTML = filtered.map(product => `
        <div class="product-card">
            ${product.photo ? `<img src="${product.photo}" class="product-image" alt="${product.name}">` : `<div class="product-no-image">${getCategoryEmoji(product.category)}</div>`}
            <div class="product-info">
                <span class="product-category">${getCategoryIcon(product.category)} ${product.category}</span>
                <div class="product-title">${product.name}</div>
                <div class="product-price">${product.price} FCFA <small>/${product.unit}</small></div>
                <div class="product-quantity">📦 ${product.quantity} ${product.unit} disponible${product.quantity > 1 ? 's' : ''}</div>
                ${product.description ? `<div class="product-desc" style="font-size:0.75rem; color:#8aa88a; margin:8px 0;">📝 ${product.description}</div>` : ''}
                <div class="product-footer">
                    <span class="product-seller">👩‍🌾 ${product.seller}</span>
                    <div class="product-actions">
                        <button class="contact-btn" data-phone="${product.phone}" data-name="${product.name}">📞</button>
                        <button class="edit-btn" data-id="${product.id}">✏️</button>
                        <button class="delete-btn" data-id="${product.id}">🗑️</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.contact-btn').forEach(btn => {
        btn.onclick = () => window.open(`https://wa.me/237${btn.dataset.phone}?text=Bonjour%20pour%20${encodeURIComponent(btn.dataset.name)}`, '_blank');
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = () => openEditModal(btn.dataset.id);
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = () => deleteProduct(btn.dataset.id);
    });
}

function getCategoryEmoji(cat) {
    const emojis = { légume: "🥬", tubercule: "🥔", fruit: "🍎", herbe: "🌿", épice: "🌶️" };
    return emojis[cat] || "🌾";
}

function getCategoryIcon(cat) {
    const icons = { légume: "🥬", tubercule: "🥔", fruit: "🍎", herbe: "🌿", épice: "🌶️" };
    return icons[cat] || "🌾";
}

// Écouter les changements en temps réel
const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
onSnapshot(q, (snapshot) => {
    allProducts = [];
    snapshot.forEach(doc => {
        allProducts.push({ id: doc.id, ...doc.data() });
    });
    displayProducts(allProducts);
});

// Filtres
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;
        displayProducts(allProducts);
    });
});

document.getElementById('searchInput')?.addEventListener('input', () => displayProducts(allProducts));

// ============ MODIFIER & SUPPRIMER ============
async function openEditModal(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = product.name || '';
    document.getElementById('editCategory').value = product.category || 'légume';
    document.getElementById('editDesc').value = product.description || '';
    document.getElementById('editPrice').value = product.price || 0;
    document.getElementById('editUnit').value = product.unit || 'kg';
    document.getElementById('editQuantity').value = product.quantity || 0;
    document.getElementById('editSeller').value = product.seller || '';
    document.getElementById('editPhone').value = product.phone || '';
    document.getElementById('editPassword').value = '';
    
    document.getElementById('editModal').style.display = 'flex';
}

document.getElementById('editForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const password = document.getElementById('editPassword').value;
    const product = allProducts.find(p => p.id === id);
    
    if (!product || product.password !== password) {
        alert('❌ Mot de passe incorrect !');
        return;
    }
    
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
        name: document.getElementById('editName').value,
        category: document.getElementById('editCategory').value,
        description: document.getElementById('editDesc').value,
        price: parseInt(document.getElementById('editPrice').value),
        unit: document.getElementById('editUnit').value,
        quantity: parseInt(document.getElementById('editQuantity').value),
        seller: document.getElementById('editSeller').value,
        phone: document.getElementById('editPhone').value
    });
    
    document.getElementById('editModal').style.display = 'none';
    alert('✅ Produit modifié !');
});

async function deleteProduct(id) {
    const password = prompt('🔐 Mot de passe pour supprimer :');
    if (!password) return;
    
    const product = allProducts.find(p => p.id === id);
    if (!product || product.password !== password) {
        alert('❌ Mot de passe incorrect !');
        return;
    }
    
    if (confirm('Supprimer ce produit ?')) {
        await deleteDoc(doc(db, 'products', id));
        alert('✅ Produit supprimé');
    }
}

// ============ MODALS ============
document.getElementById('addProductBtn')?.addEventListener('click', () => {
    document.getElementById('addModal').style.display = 'flex';
});

document.querySelector('.close-modal')?.addEventListener('click', () => {
    document.getElementById('addModal').style.display = 'none';
});
document.querySelector('.close-edit-modal')?.addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
});
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// ============ PWA INSTALLATION ============
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const closeInstallBtn = document.getElementById('closeInstallBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBanner.style.display = 'flex';
});

installBtn?.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBanner.style.display = 'none';
        }
        deferredPrompt = null;
    }
});

closeInstallBtn?.addEventListener('click', () => {
    installBanner.style.display = 'none';
});

window.addEventListener('appinstalled', () => {
    installBanner.style.display = 'none';
});

// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker enregistré:', reg))
        .catch(err => console.log('Erreur Service Worker:', err));
}

// ============ INITIALISATION ============
initDefaultProducts();
console.log("🔥 AgriLocal prêt !");
