import React, { useState } from 'react';
import { ShoppingCart, Search, Star, Truck, Shield, CreditCard, ChevronRight, Filter, Plus, Edit, Trash2, X, Settings, Package, BarChart, Download, Eye, ExternalLink } from 'lucide-react';

const INITIAL_PRODUCTS = [
  { id: 1, name: "Maillot PSG 2024", club: "PSG", price: 89.99, cost: 45.00, image: "PSG", stock: 100, supplierUrl: "https://supplier.com/psg", rating: 4.8, sales: 1250, isNew: true },
  { id: 2, name: "Maillot Real Madrid", club: "Real Madrid", price: 94.99, cost: 47.50, image: "RMA", stock: 75, supplierUrl: "https://supplier.com/rma", rating: 4.9, sales: 980, promo: 15 },
  { id: 3, name: "Maillot France", club: "France", price: 99.99, cost: 50.00, image: "FRA", stock: 120, supplierUrl: "https://supplier.com/fra", rating: 4.7, sales: 2100, isNew: true },
];

const CLUBS = ["Tous", "PSG", "Real Madrid", "France"];
const SIZES = ["S", "M", "L", "XL"];

export default function App() {
  const [page, setPage] = useState('home');
  const [adminMode, setAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState('orders');
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterClub, setFilterClub] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [checkoutFormData, setCheckoutFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '', postal: ''
  });

  const showNotif = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const filteredProducts = products.filter(p => filterClub === 'Tous' || p.club === filterClub);

  const addToCart = (product, size) => {
    setCart([...cart, { ...product, size, cartId: Date.now() }]);
    showNotif('Produit ajoute au panier');
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
    showNotif('Produit retire');
  };

  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);
  const getTotalProfit = () => orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + (item.price - item.cost), 0), 0).toFixed(2);

  const deleteProduct = (id) => {
    if (window.confirm('Supprimer ?')) {
      setProducts(products.filter(p => p.id !== id));
      showNotif('Produit supprime');
    }
  };

  const saveProduct = (data) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...data, id: editingProduct.id, sales: p.sales, rating: p.rating } : p));
    } else {
      setProducts([...products, { ...data, id: Date.now(), sales: 0, rating: 4.5 }]);
    }
    setShowProductForm(false);
    setEditingProduct(null);
    showNotif('Produit enregistre');
  };

  const Notification = () => showNotification ? (
    <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl">
      {notificationMessage}
    </div>
  ) : null;

  const Header = () => (
    <header className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      <Notification />
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => { setPage('home'); setAdminMode(false); }} className="text-2xl font-bold">JerseyShop</button>
        <div className="flex items-center gap-4">
          {!adminMode && (
            <>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 px-4 py-2 rounded-full w-48 focus:outline-none"
              />
              <button onClick={() => setPage('cart')} className="relative">
                <ShoppingCart size={24} />
                {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">{cart.length}</span>}
              </button>
            </>
          )}
          <button onClick={() => { setAdminMode(!adminMode); showNotif(adminMode ? 'Mode client' : 'Mode admin'); }}>
            <Settings size={24} className={adminMode ? 'text-blue-400' : ''} />
          </button>
        </div>
      </div>
    </header>
  );

  if (adminMode) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white shadow">
            <div className="container mx-auto px-4 flex gap-8 border-b">
              <button onClick={() => setAdminTab('orders')} className={`py-4 font-semibold ${adminTab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                Commandes ({orders.length})
              </button>
              <button onClick={() => setAdminTab('products')} className={`py-4 font-semibold ${adminTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                Produits ({products.length})
              </button>
              <button onClick={() => setAdminTab('stats')} className={`py-4 font-semibold ${adminTab === 'stats' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                Statistiques
              </button>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            {adminTab === 'orders' && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Commandes</h1>
                {orders.length === 0 ? (
                  <div className="bg-white p-12 rounded-lg shadow text-center">
                    <p className="text-xl text-gray-600">Aucune commande</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(o => (
                      <div key={o.id} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between mb-4">
                          <div>
                            <h3 className="font-bold">Commande #{o.id}</h3>
                            <p className="text-sm text-gray-600">{o.date} - {o.customer.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{o.total} EUR</p>
                            <p className="text-green-600 font-semibold">Profit: {(parseFloat(o.total) - o.items.reduce((s, i) => s + i.cost, 0)).toFixed(2)} EUR</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedOrder(o)} className="w-full bg-blue-600 text-white py-2 rounded">
                          Voir details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {adminTab === 'products' && (
              <div>
                <div className="flex justify-between mb-6">
                  <h1 className="text-3xl font-bold">Produits</h1>
                  <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2">
                    <Plus size={20} /> Ajouter
                  </button>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {products.map(p => (
                    <div key={p.id} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-4xl font-bold text-blue-600">{p.image}</div>
                      <div className="p-4">
                        <h3 className="font-bold mb-2">{p.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">Prix: {p.price} EUR | Cout: {p.cost} EUR</p>
                        <p className="text-green-600 font-semibold mb-3">Marge: {(p.price - p.cost).toFixed(2)} EUR</p>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingProduct(p); setShowProductForm(true); }} className="flex-1 bg-blue-600 text-white p-2 rounded">
                            <Edit size={16} className="mx-auto" />
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="flex-1 bg-red-600 text-white p-2 rounded">
                            <Trash2 size={16} className="mx-auto" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminTab === 'stats' && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Statistiques</h1>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <Package className="text-blue-600 mb-2" size={40} />
                    <p className="text-gray-600">Produits</p>
                    <p className="text-3xl font-bold">{products.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <ShoppingCart className="text-green-600 mb-2" size={40} />
                    <p className="text-gray-600">Commandes</p>
                    <p className="text-3xl font-bold">{orders.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <CreditCard className="text-purple-600 mb-2" size={40} />
                    <p className="text-gray-600">Revenus</p>
                    <p className="text-3xl font-bold">{orders.reduce((s, o) => s + parseFloat(o.total), 0).toFixed(2)} EUR</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <BarChart className="text-orange-600 mb-2" size={40} />
                    <p className="text-gray-600">Profit Total</p>
                    <p className="text-3xl font-bold text-green-600">{getTotalProfit()} EUR</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showProductForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                <h2 className="text-2xl font-bold mb-4">{editingProduct ? 'Modifier' : 'Nouveau'} Produit</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const data = {
                    name: e.target.pname.value,
                    club: e.target.club.value,
                    price: parseFloat(e.target.price.value),
                    cost: parseFloat(e.target.cost.value),
                    stock: parseInt(e.target.stock.value),
                    image: e.target.image.value,
                    supplierUrl: e.target.supplier.value
                  };
                  saveProduct(data);
                }} className="space-y-4">
                  <input name="pname" defaultValue={editingProduct?.name} placeholder="Nom" required className="w-full border rounded px-3 py-2" />
                  <input name="club" defaultValue={editingProduct?.club} placeholder="Club" required className="w-full border rounded px-3 py-2" />
                  <div className="grid grid-cols-3 gap-4">
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} placeholder="Prix" required className="w-full border rounded px-3 py-2" />
                    <input name="cost" type="number" step="0.01" defaultValue={editingProduct?.cost} placeholder="Cout" required className="w-full border rounded px-3 py-2" />
                    <input name="stock" type="number" defaultValue={editingProduct?.stock || 100} placeholder="Stock" required className="w-full border rounded px-3 py-2" />
                  </div>
                  <input name="image" defaultValue={editingProduct?.image} placeholder="Code Image" required className="w-full border rounded px-3 py-2" />
                  <input name="supplier" type="url" defaultValue={editingProduct?.supplierUrl} placeholder="URL Fournisseur" className="w-full border rounded px-3 py-2" />
                  <div className="flex gap-3">
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Enregistrer</button>
                    <button type="button" onClick={() => setShowProductForm(false)} className="flex-1 bg-gray-300 py-2 rounded">Annuler</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                <div className="flex justify-between mb-4">
                  <h2 className="text-2xl font-bold">Commande #{selectedOrder.id}</h2>
                  <button onClick={() => setSelectedOrder(null)}><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <p><strong>Client:</strong> {selectedOrder.customer.name}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer.email}</p>
                    <p><strong>Adresse:</strong> {selectedOrder.customer.address}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded">
                    <h3 className="font-bold mb-2">Articles</h3>
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="mb-2 pb-2 border-b">
                        <p className="font-semibold">{item.name} - Taille: {item.size}</p>
                        <p className="text-sm">Prix: {item.price} EUR | Cout: {item.cost} EUR | Marge: {(item.price - item.cost).toFixed(2)} EUR</p>
                        {item.supplierUrl && (
                          <a href={item.supplierUrl} target="_blank" className="text-blue-600 text-sm flex items-center gap-1">
                            <ExternalLink size={14} /> Commander
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Profit Net:</span>
                      <span className="text-green-600">{(parseFloat(selectedOrder.total) - selectedOrder.items.reduce((s, i) => s + i.cost, 0)).toFixed(2)} EUR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (page === 'home') {
    return (
      <div>
        <Header />
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-6">Maillots de Football</h1>
            <p className="text-xl mb-8">Les meilleures repliques authentiques</p>
            <button onClick={() => setPage('shop')} className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold">
              Decouvrir
            </button>
          </div>
        </section>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Produits Populaires</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {products.slice(0, 3).map(p => (
                <div key={p.id} className="bg-white rounded-lg shadow hover:shadow-xl transition cursor-pointer" onClick={() => { setSelectedProduct(p); setPage('product'); }}>
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-4xl font-bold text-blue-600">{p.image}</div>
                  <div className="p-4">
                    <h3 className="font-bold mb-2">{p.name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">{p.price} EUR</span>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">Voir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (page === 'shop') {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-6">Boutique</h1>
            <select value={filterClub} onChange={(e) => setFilterClub(e.target.value)} className="mb-6 border rounded px-3 py-2">
              {CLUBS.map(club => <option key={club}>{club}</option>)}
            </select>
            <div className="grid md:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-white rounded-lg shadow hover:shadow-xl transition cursor-pointer" onClick={() => { setSelectedProduct(p); setPage('product'); }}>
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-4xl font-bold text-blue-600">{p.image}</div>
                  <div className="p-4">
                    <h3 className="font-bold mb-2">{p.name}</h3>
                    <span className="text-2xl font-bold text-blue-600">{p.price} EUR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'product' && selectedProduct) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <button onClick={() => setPage('shop')} className="text-blue-600 mb-4">← Retour</button>
            <div className="bg-white rounded-lg shadow-lg p-6 grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-6xl font-bold text-blue-600">{selectedProduct.image}</div>
              <div>
                <h1 className="text-3xl font-bold mb-4">{selectedProduct.name}</h1>
                <div className="text-4xl font-bold text-blue-600 mb-6">{selectedProduct.price} EUR</div>
                <div className="mb-6">
                  <label className="block font-semibold mb-2">Taille:</label>
                  <div className="flex gap-2">
                    {SIZES.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)} className={`px-4 py-2 border rounded ${selectedSize === size ? 'bg-blue-600 text-white' : ''}`}>{size}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => { addToCart(selectedProduct, selectedSize); }} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold">
                  Ajouter au panier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'cart') {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-6">Panier</h1>
            {cart.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-lg shadow">
                <p className="mb-4">Votre panier est vide</p>
                <button onClick={() => setPage('shop')} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Continuer</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  {cart.map(item => (
                    <div key={item.cartId} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="text-sm text-gray-600">Taille: {item.size}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold">{item.price} EUR</span>
                        <button onClick={() => removeFromCart(item.cartId)} className="text-red-500"><X size={20} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-6 rounded-lg shadow h-fit">
                  <h2 className="font-bold text-xl mb-4">Total</h2>
                  <div className="text-2xl font-bold text-blue-600 mb-4">{getTotalPrice()} EUR</div>
                  <button onClick={() => setPage('checkout')} className="w-full bg-blue-600 text-white py-3 rounded-lg">Payer</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'checkout') {
    const handleSubmit = () => {
      alert('Bouton clique !');
      
      if (!checkoutFormData.name || !checkoutFormData.email || !checkoutFormData.phone || !checkoutFormData.address || !checkoutFormData.city || !checkoutFormData.postal) {
        alert('Veuillez remplir tous les champs');
        return;
      }

      const newOrder = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        items: [...cart],
        total: getTotalPrice(),
        status: 'En attente',
        customer: checkoutFormData
      };
      
      setOrders([...orders, newOrder]);
      setCart([]);
      setCheckoutFormData({ name: '', email: '', phone: '', address: '', city: '', postal: '' });
      showNotif('Paiement reussi');
      setPage('confirmation');
    };

    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Paiement</h1>
            
            {cart.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-xl text-gray-600 mb-4">Votre panier est vide</p>
                <button onClick={() => setPage('shop')} className="bg-blue-600 text-white px-6 py-3 rounded-lg">
                  Retour boutique
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-4">Recapitulatif</h2>
                  <div className="space-y-3 mb-4">
                    {cart.map(item => (
                      <div key={item.cartId} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-gray-600">Taille: {item.size}</p>
                        </div>
                        <span className="font-bold">{item.price} EUR</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-3 border-t">
                    <span>Total:</span>
                    <span className="text-blue-600">{getTotalPrice()} EUR</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Vos informations</h2>
                  
                  <div>
                    <label className="block font-semibold mb-2">Nom complet</label>
                    <input 
                      type="text"
                      value={checkoutFormData.name}
                      onChange={(e) => setCheckoutFormData({...checkoutFormData, name: e.target.value})}
                      placeholder="Jean Dupont"
                      className="w-full border-2 rounded px-4 py-3 text-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Email</label>
                    <input 
                      type="email"
                      value={checkoutFormData.email}
                      onChange={(e) => setCheckoutFormData({...checkoutFormData, email: e.target.value})}
                      placeholder="jean@email.com"
                      className="w-full border-2 rounded px-4 py-3 text-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Telephone</label>
                    <input 
                      type="tel"
                      value={checkoutFormData.phone}
                      onChange={(e) => setCheckoutFormData({...checkoutFormData, phone: e.target.value})}
                      placeholder="0612345678"
                      className="w-full border-2 rounded px-4 py-3 text-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Adresse</label>
                    <input 
                      type="text"
                      value={checkoutFormData.address}
                      onChange={(e) => setCheckoutFormData({...checkoutFormData, address: e.target.value})}
                      placeholder="123 Rue de la Paix"
                      className="w-full border-2 rounded px-4 py-3 text-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-2">Ville</label>
                      <input 
                        type="text"
                        value={checkoutFormData.city}
                        onChange={(e) => setCheckoutFormData({...checkoutFormData, city: e.target.value})}
                        placeholder="Paris"
                        className="w-full border-2 rounded px-4 py-3 text-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">Code postal</label>
                      <input 
                        type="text"
                        value={checkoutFormData.postal}
                        onChange={(e) => setCheckoutFormData({...checkoutFormData, postal: e.target.value})}
                        placeholder="75001"
                        className="w-full border-2 rounded px-4 py-3 text-lg"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleSubmit}
                    className="w-full bg-green-600 text-white py-5 rounded-lg font-bold text-xl hover:bg-green-700 transition mt-6 shadow-xl"
                  >
                    VALIDER LE PAIEMENT - {getTotalPrice()} EUR
                  </button>

                  <div className="text-center text-sm text-gray-600 flex items-center justify-center gap-2 mt-3">
                    <Shield size={16} />
                    Paiement securise
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'confirmation') {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 py-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-4">Commande confirmee</h1>
              <p className="text-gray-600 mb-6">Merci pour votre achat</p>
              <button onClick={() => setPage('home')} className="bg-blue-600 text-white px-8 py-3 rounded-lg">Retour</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div><Header /><div className="min-h-screen bg-gray-50" /></div>;
}
