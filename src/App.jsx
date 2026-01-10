import React, { useState, useRef } from 'react';
import { ShoppingCart, User, Search, Star, Plus, Minus, X, Shield, Package, BarChart, CreditCard, Edit, Trash2, LogOut, Upload } from 'lucide-react';

const ADMIN_EMAIL = "admin@jerseyshop.com";
const ADMIN_PASSWORD = "admin123";

const INITIAL_PRODUCTS = [
  { id: 1, name: "Maillot PSG Domicile 2024", club: "PSG", price: 89.99, cost: 45.00, category: "Domicile", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400", stock: 100, rating: 4.8 },
  { id: 2, name: "Maillot Real Madrid", club: "Real Madrid", price: 94.99, cost: 47.50, category: "Domicile", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400", stock: 75, rating: 4.9 },
  { id: 3, name: "Maillot France", club: "France", price: 99.99, cost: 50.00, category: "Exterieur", image: "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400", stock: 120, rating: 4.7 },
  { id: 4, name: "Maillot Barcelona", club: "Barcelona", price: 89.99, cost: 44.00, category: "Domicile", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400", stock: 90, rating: 4.8 },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function JerseyShop() {
  const [page, setPage] = useState('home');
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [notification, setNotification] = useState('');
  const [adminTab, setAdminTab] = useState('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const [productName, setProductName] = useState('');
  const [productClub, setProductClub] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productCategory, setProductCategory] = useState('Domicile');
  const [productImage, setProductImage] = useState('');
  const [productStock, setProductStock] = useState('100');
  const [imagePreview, setImagePreview] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPostal, setCustomerPostal] = useState('');

  // Sauvegarde dans localStorage
  React.useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  React.useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  React.useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  React.useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  const filteredProducts = products.filter(p => 
    searchTerm === '' || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.club.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        notify('Image trop volumineuse (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = () => {
    if (loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
      setCurrentUser({ id: 'admin', email: ADMIN_EMAIL, name: 'Admin', isAdmin: true });
      setShowAuth(false);
      setPage('admin');
      notify('Connexion admin reussie');
      setLoginEmail('');
      setLoginPassword('');
    } else {
      const user = users.find(u => u.email === loginEmail && u.password === loginPassword);
      if (user) {
        setCurrentUser(user);
        setShowAuth(false);
        notify('Connexion reussie');
        setLoginEmail('');
        setLoginPassword('');
      } else {
        notify('Email ou mot de passe incorrect');
      }
    }
  };

  const handleRegister = () => {
    if (!registerName || !registerEmail || !registerPassword) {
      notify('Veuillez remplir tous les champs');
      return;
    }
    if (registerPassword.length < 6) {
      notify('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }
    if (users.find(u => u.email === registerEmail)) {
      notify('Cet email est deja utilise');
      return;
    }
    const newUser = {
      id: Date.now(),
      name: registerName,
      email: registerEmail,
      password: registerPassword,
      isAdmin: false
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setShowAuth(false);
    notify('Compte cree avec succes');
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
  };

  const logout = () => {
    setCurrentUser(null);
    setShowUserMenu(false);
    setPage('home');
    notify('Deconnexion reussie');
  };

  const addToCart = (product, size, qty) => {
    setCart([...cart, { ...product, size, quantity: qty, cartId: Date.now() }]);
    notify('Ajoute au panier');
    setShowCart(true);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, newQty) => {
    if (newQty < 1) return;
    setCart(cart.map(item => item.cartId === cartId ? {...item, quantity: newQty} : item));
  };

  const getTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  const getCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = () => {
    if (!currentUser) {
      notify('Veuillez vous connecter');
      setShowAuth(true);
      return;
    }
    if (!customerName || !customerEmail || !customerPhone || !customerAddress || !customerCity || !customerPostal) {
      notify('Veuillez remplir tous les champs');
      return;
    }
    const order = {
      id: Date.now(),
      date: new Date().toLocaleString('fr-FR'),
      items: [...cart],
      total: getTotal(),
      customer: { name: customerName, email: customerEmail, phone: customerPhone, address: customerAddress, city: customerCity, postal: customerPostal },
      userId: currentUser.id
    };
    setOrders([...orders, order]);
    setCart([]);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerCity('');
    setCustomerPostal('');
    setPage('confirmation');
    notify('Commande validee');
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductName('');
    setProductClub('');
    setProductPrice('');
    setProductCost('');
    setProductCategory('Domicile');
    setProductImage('');
    setImagePreview('');
    setProductStock('100');
    setShowProductForm(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductClub(product.club);
    setProductPrice(product.price.toString());
    setProductCost(product.cost.toString());
    setProductCategory(product.category);
    setProductImage(product.image);
    setImagePreview(product.image);
    setProductStock(product.stock.toString());
    setShowProductForm(true);
  };

  const saveProduct = () => {
    if (!productName || !productClub || !productPrice || !productCost || !productImage) {
      notify('Veuillez remplir tous les champs et ajouter une image');
      return;
    }
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? {
        ...p,
        name: productName,
        club: productClub,
        price: parseFloat(productPrice),
        cost: parseFloat(productCost),
        category: productCategory,
        image: productImage,
        stock: parseInt(productStock)
      } : p));
      notify('Produit modifie');
    } else {
      setProducts([...products, {
        id: Date.now(),
        name: productName,
        club: productClub,
        price: parseFloat(productPrice),
        cost: parseFloat(productCost),
        category: productCategory,
        image: productImage,
        stock: parseInt(productStock),
        rating: 4.5
      }]);
      notify('Produit ajoute');
    }
    setShowProductForm(false);
  };

  const deleteProduct = (id) => {
    if (window.confirm('Supprimer ce produit ?')) {
      setProducts(products.filter(p => p.id !== id));
      notify('Produit supprime');
    }
  };

  const Header = () => (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setPage('home')} className="text-2xl font-bold">
            JERSEY<span className="text-blue-600">SHOP</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600 w-64"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>
            <button onClick={() => setShowCart(true)} className="relative p-2 hover:bg-gray-100 rounded-lg">
              <ShoppingCart size={22} />
              {getCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {getCount()}
                </span>
              )}
            </button>
            <div className="relative">
              <button onClick={() => currentUser ? setShowUserMenu(!showUserMenu) : setShowAuth(true)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
                <User size={22} />
                {currentUser && <span className="hidden md:block text-sm">{currentUser.name}</span>}
              </button>
              {showUserMenu && currentUser && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border py-2 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="font-semibold text-sm">{currentUser.name}</p>
                    <p className="text-xs text-gray-600">{currentUser.email}</p>
                  </div>
                  {currentUser.isAdmin && (
                    <button onClick={() => { setPage('admin'); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600">
                      Administration
                    </button>
                  )}
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2">
                    <LogOut size={16} /> Deconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {notification && (
        <div className="fixed top-24 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50">
          {notification}
        </div>
      )}
    </header>
  );

  if (showAuth) {
    return (
      <div>
        <Header />
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{authMode === 'login' ? 'Connexion' : 'Inscription'}</h2>
              <button onClick={() => setShowAuth(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            {authMode === 'login' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mot de passe</label>
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
                <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                  Se connecter
                </button>
                <button onClick={() => setAuthMode('register')} className="w-full text-sm text-blue-600 hover:underline">
                  Pas de compte ? S inscrire
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom complet</label>
                  <input type="text" value={registerName} onChange={(e) => setRegisterName(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mot de passe (min 6 caracteres)</label>
                  <input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
                <button onClick={handleRegister} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                  Creer mon compte
                </button>
                <button onClick={() => setAuthMode('login')} className="w-full text-sm text-blue-600 hover:underline">
                  Deja un compte ? Se connecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showCart) {
    return (
      <div>
        <Header />
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Panier ({getCount()})</h2>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">Votre panier est vide</p>
                  <button onClick={() => { setShowCart(false); setPage('shop'); }} className="bg-blue-600 text-white px-6 py-3 rounded-lg">
                    Decouvrir
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item.cartId} className="flex gap-4 p-3 border rounded-lg">
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                          <p className="text-xs text-gray-600 mb-2">Taille: {item.size}</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} className="w-7 h-7 border rounded flex items-center justify-center">
                              <Minus size={14} />
                            </button>
                            <span className="text-sm w-8 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} className="w-7 h-7 border rounded flex items-center justify-center">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold mb-2">{(item.price * item.quantity).toFixed(2)}€</p>
                          <button onClick={() => removeFromCart(item.cartId)} className="text-red-500 text-xs">
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>{getTotal()}€</span>
                    </div>
                  </div>
                  <button onClick={() => { setShowCart(false); setPage('checkout'); }} className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold">
                    Commander
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showProductForm) {
    return (
      <div>
        <Header />
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingProduct ? 'Modifier' : 'Ajouter'} un produit</h2>
              <button onClick={() => setShowProductForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Image du produit</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200" />
                      <button onClick={() => { setProductImage(''); setImagePreview(''); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Upload className="text-gray-400" size={32} />
                    </div>
                  )}
                  <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center gap-2">
                    <Upload size={18} />
                    Choisir une image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG ou GIF (max 5MB)</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nom du produit</label>
                <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Club</label>
                <input type="text" value={productClub} onChange={(e) => setProductClub(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prix de vente</label>
                  <input type="number" step="0.01" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prix achat</label>
                  <input type="number" step="0.01" value={productCost} onChange={(e) => setProductCost(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Categorie</label>
                  <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600">
                    <option value="Domicile">Domicile</option>
                    <option value="Exterieur">Exterieur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stock</label>
                  <input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
              </div>
              {productPrice && productCost && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-700 font-semibold">Marge prevue: {(parseFloat(productPrice) - parseFloat(productCost)).toFixed(2)}€</p>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button onClick={saveProduct} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
                  {editingProduct ? 'Modifier' : 'Ajouter'}
                </button>
                <button onClick={() => setShowProductForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'admin' && currentUser?.isAdmin) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b">
            <div className="container mx-auto px-4 flex gap-6">
              <button onClick={() => setAdminTab('products')} className={`py-4 px-6 font-semibold ${adminTab === 'products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
                Produits
              </button>
              <button onClick={() => setAdminTab('orders')} className={`py-4 px-6 font-semibold ${adminTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
                Commandes
              </button>
              <button onClick={() => setAdminTab('stats')} className={`py-4 px-6 font-semibold ${adminTab === 'stats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
                Statistiques
              </button>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            {adminTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-bold">Gestion des produits</h1>
                  <button onClick={openAddProduct} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={20} /> Ajouter un produit
                  </button>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {products.map(p => (
                    <div key={p.id} className="bg-white rounded-lg shadow p-3 flex flex-col">
                      <div className="w-full h-40 flex items-center justify-center bg-gray-50 rounded mb-3 p-3">
                        <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">Prix: {p.price}€ | Cout: {p.cost}€</p>
                      <p className="text-green-600 font-semibold text-sm mb-3">Marge: {(p.price - p.cost).toFixed(2)}€</p>
                      <div className="flex gap-2">
                        <button onClick={() => openEditProduct(p)} className="flex-1 bg-blue-100 text-blue-600 py-1.5 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-1 text-sm">
                          <Edit size={14} /> Modifier
                        </button>
                        <button onClick={() => deleteProduct(p.id)} className="flex-1 bg-red-100 text-red-600 py-1.5 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1 text-sm">
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {adminTab === 'orders' && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Commandes ({orders.length})</h1>
                {orders.length === 0 ? (
                  <div className="bg-white rounded-lg p-12 text-center">
                    <p className="text-gray-500">Aucune commande</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="bg-white rounded-lg p-6">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-bold">Commande #{order.id}</h3>
                            <p className="text-sm text-gray-600">{order.date} - {order.customer.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600">{order.total}€</p>
                            <p className="text-green-600 text-sm">Profit: {(parseFloat(order.total) - order.items.reduce((s,i) => s + (i.cost * i.quantity), 0)).toFixed(2)}€</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {adminTab === 'stats' && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Statistiques</h1>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg p-6">
                    <Package className="text-blue-600 mb-2" size={32} />
                    <p className="text-gray-600">Produits</p>
                    <p className="text-2xl font-bold">{products.length}</p>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <ShoppingCart className="text-green-600 mb-2" size={32} />
                    <p className="text-gray-600">Commandes</p>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <CreditCard className="text-purple-600 mb-2" size={32} />
                    <p className="text-gray-600">Revenus</p>
                    <p className="text-2xl font-bold">{orders.reduce((s, o) => s + parseFloat(o.total), 0).toFixed(2)}€</p>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <BarChart className="text-orange-600 mb-2" size={32} />
                    <p className="text-gray-600">Profit</p>
                    <p className="text-2xl font-bold text-green-600">{orders.reduce((sum, o) => sum + (parseFloat(o.total) - o.items.reduce((s,i) => s + (i.cost * i.quantity), 0)), 0).toFixed(2)}€</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'home') {
    return (
      <div>
        <Header />
        <section className="relative h-96 bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="container mx-auto px-4 h-full flex items-center">
            <div className="text-white">
              <h1 className="text-5xl font-bold mb-4">MAILLOTS 2024</h1>
              <p className="text-xl mb-8">Les plus grands clubs europeens</p>
              <button onClick={() => setPage('shop')} className="bg-white text-gray-900 px-8 py-3 rounded-lg font-bold">
                Decouvrir
              </button>
            </div>
          </div>
        </section>
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Nos Produits</h2>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-xl">Aucun produit trouve</p>
                <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 hover:underline">
                  Reinitialiser la recherche
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-6">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer flex flex-col" onClick={() => { setSelectedProduct(p); setPage('product'); }}>
                    <div className="h-48 w-full flex items-center justify-center bg-gray-50 rounded-t-lg p-3">
                      <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{p.name}</h3>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold">{p.price}€</span>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-current" />
                          <span className="text-xs">{p.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (page === 'shop') {
    return (
      <div>
        <Header />
        <div className="bg-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-8">BOUTIQUE</h1>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-xl">Aucun produit trouve</p>
                <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 hover:underline">
                  Reinitialiser la recherche
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-6">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer flex flex-col" onClick={() => { setSelectedProduct(p); setPage('product'); }}>
                    <div className="h-48 w-full flex items-center justify-center bg-gray-50 rounded-t-lg p-3">
                      <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{p.name}</h3>
                      <span className="text-lg font-bold mt-auto">{p.price}€</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'product' && selectedProduct) {
    return (
      <div>
        <Header />
        <div className="bg-white py-8">
          <div className="container mx-auto px-4">
            <button onClick={() => setPage('shop')} className="text-blue-600 mb-6">← Retour</button>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="max-w-full max-h-[500px] object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-4">{selectedProduct.name}</h1>
                <div className="text-4xl font-bold mb-8">{selectedProduct.price}€</div>
                <div className="mb-6">
                  <label className="block font-semibold mb-3">Taille</label>
                  <div className="grid grid-cols-6 gap-2">
                    {SIZES.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)} className={`py-3 border-2 rounded font-semibold ${selectedSize === size ? 'border-black bg-black text-white' : 'border-gray-300'}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-8">
                  <label className="block font-semibold mb-3">Quantite</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 border-2 rounded flex items-center justify-center">
                      <Minus size={20} />
                    </button>
                    <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 border-2 rounded flex items-center justify-center">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
                <button onClick={() => { addToCart(selectedProduct, selectedSize, quantity); setQuantity(1); }} className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg mb-4">
                  AJOUTER AU PANIER - {(selectedProduct.price * quantity).toFixed(2)}€
                </button>
                <div className="flex items-center gap-3">
                  <Shield size={20} className="text-green-600" />
                  <span className="text-sm">Paiement securise</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'checkout') {
    return (
      <div>
        <Header />
        <div className="bg-gray-50 py-8">
          <div className="container mx-auto px-4 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8">PAIEMENT</h1>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6">Informations de livraison</h2>
                  <div className="space-y-4">
                    <input type="text" placeholder="Nom complet" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="email" placeholder="Email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                      <input type="tel" placeholder="Telephone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                    </div>
                    <input type="text" placeholder="Adresse" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Ville" value={customerCity} onChange={(e) => setCustomerCity(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                      <input type="text" placeholder="Code postal" value={customerPostal} onChange={(e) => setCustomerPostal(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white rounded-lg p-6 sticky top-24">
                  <h2 className="text-lg font-bold mb-4">RECAPITULATIF</h2>
                  <div className="space-y-3 mb-4 pb-4 border-b">
                    {cart.map(item => (
                      <div key={item.cartId} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="font-semibold">{(item.price * item.quantity).toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xl font-bold mb-4">
                    <span>Total</span>
                    <span>{getTotal()}€</span>
                  </div>
                  <button onClick={placeOrder} className="w-full bg-black text-white py-4 rounded-lg font-bold">
                    VALIDER LA COMMANDE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'confirmation') {
    return (
      <div>
        <Header />
        <div className="bg-gray-50 min-h-screen py-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <div className="bg-white rounded-2xl p-12">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4">Commande confirmee !</h1>
              <p className="text-xl text-gray-600 mb-8">Merci pour votre achat</p>
              <button onClick={() => setPage('home')} className="bg-black text-white px-8 py-4 rounded-lg font-bold">
                RETOUR A L ACCUEIL
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div><Header /></div>;
}
