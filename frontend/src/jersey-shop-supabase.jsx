import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, User, Search, Star, Plus, Minus, X, Shield, Package, BarChart, CreditCard, Edit, Trash2, LogOut, Upload } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';

// Configuration Supabase
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'VOTRE_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'VOTRE_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// Configuration Stripe
// stripePromise pourrait être utilisé pour Stripe Elements dans le futur
// eslint-disable-next-line no-unused-vars
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const ADMIN_EMAIL = "admin@jerseyshop.com";

const INITIAL_PRODUCTS = [
  { id: 1, name: "Maillot PSG Domicile 2024", club: "PSG", price: 89.99, cost: 45.00, category: "Domicile", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400", stock: 100, rating: 4.8 },
  { id: 2, name: "Maillot Real Madrid", club: "Real Madrid", price: 94.99, cost: 47.50, category: "Domicile", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400", stock: 75, rating: 4.9 },
  { id: 3, name: "Maillot France", club: "France", price: 99.99, cost: 50.00, category: "Exterieur", image: "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400", stock: 120, rating: 4.7 },
  { id: 4, name: "Maillot Barcelona", club: "Barcelona", price: 89.99, cost: 44.00, category: "Domicile", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400", stock: 90, rating: 4.8 },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function JerseyShop() {
  const [page, setPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState(() => {
    // Charger le panier depuis localStorage
    const savedCart = localStorage.getItem('jerseyshop_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
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
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Sauvegarder le panier dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('jerseyshop_cart', JSON.stringify(cart));
  }, [cart]);

  // Charger les données au démarrage
  useEffect(() => {
    const initApp = async () => {
      await checkUser();
      await loadProducts();
      await loadOrders();
    };
    initApp();

    // Écouter les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const isAdmin = session.user.email === ADMIN_EMAIL;
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
          isAdmin
        });
        console.log('✅ User logged in:', session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        console.log('👋 User logged out');
      }
    });

    // Cleanup
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Gérer le retour après paiement Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId && page !== 'success') {
      console.log('🔄 Détection session Stripe:', sessionId);
      
      // Changer la page en success
      setPage('success');
      
      // Vérifier la session
      fetch(`${BACKEND_URL}/checkout-session/${sessionId}`)
        .then(res => res.json())
        .then(session => {
          console.log('✅ Session vérifiée:', session);
          if (session.payment_status === 'paid') {
            // Nettoyer le panier et les informations client
            setCart([]);
            setCustomerName('');
            setCustomerEmail('');
            setCustomerPhone('');
            setCustomerAddress('');
            setCustomerCity('');
            setCustomerPostal('');
            
            // Recharger les commandes
            loadOrders();
            
            // Nettoyer l'URL (enlever ?session_id=...)
            window.history.replaceState({}, '', '/');
          }
        })
        .catch(err => console.error('❌ Erreur vérification session:', err));
    }
  }, [page, window.location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vérifier l'utilisateur connecté
  const checkUser = async () => {
    try {
      // Récupérer la session active
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const user = session.user;
        const isAdmin = user.email === ADMIN_EMAIL;
        setCurrentUser({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email,
          isAdmin
        });
        console.log('✅ Session restaurée:', user.email);
      } else {
        console.log('ℹ️ Aucune session active');
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Erreur vérification utilisateur:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Charger les produits depuis Supabase
  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        // Initialiser avec les produits par défaut
        await initializeProducts();
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setProducts(INITIAL_PRODUCTS);
    }
  };

  // Initialiser les produits par défaut
  const initializeProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(INITIAL_PRODUCTS)
        .select();

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error('Erreur initialisation produits:', error);
    }
  };

  // Charger les commandes depuis Supabase
  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    }
  };

  const filteredProducts = products.filter(p => 
    searchTerm === '' || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.club.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // Upload d'image vers Supabase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5000000) {
      notify('Image trop volumineuse (max 5MB)');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setProductImage(data.publicUrl);
      setImagePreview(data.publicUrl);
      notify('Image uploadée avec succès');
    } catch (error) {
      console.error('Erreur upload image:', error);
      notify('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Connexion avec Supabase Auth
  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      const isAdmin = data.user.email === ADMIN_EMAIL;
      setCurrentUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email,
        isAdmin
      });

      setShowAuth(false);
      if (isAdmin) setPage('admin');
      notify('Connexion réussie');
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      console.error('Erreur connexion:', error);
      notify(error.message || 'Email ou mot de passe incorrect');
    }
  };

  // Inscription avec Supabase Auth
  const handleRegister = async () => {
    if (!registerName || !registerEmail || !registerPassword) {
      notify('Veuillez remplir tous les champs');
      return;
    }
    if (registerPassword.length < 6) {
      notify('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            name: registerName,
          },
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      // Vérifier si l'email doit être confirmé
      if (data.user && !data.session) {
        notify('📧 Vérifiez votre email pour confirmer votre compte');
        setShowAuth(false);
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPassword('');
        return;
      }

      // Si pas de confirmation email requise, connecter directement
      if (data.user && data.session) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email,
          name: registerName,
          isAdmin: false
        });

        setShowAuth(false);
        notify('✅ Compte créé avec succès !');
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPassword('');
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      notify(error.message || 'Erreur lors de l\'inscription');
    }
  };

  // Déconnexion
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setShowUserMenu(false);
    setPage('home');
    notify('Déconnexion réussie');
  };

  const addToCart = (product, size, qty) => {
    setCart([...cart, { ...product, size, quantity: qty, cartId: Date.now() }]);
    notify('Ajouté au panier');
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

  // Passer une commande avec Stripe
  const placeOrder = async () => {
    if (!currentUser) {
      notify('Veuillez vous connecter');
      setShowAuth(true);
      return;
    }
    if (!customerName || !customerEmail || !customerPhone || !customerAddress || !customerCity || !customerPostal) {
      notify('Veuillez remplir tous les champs');
      return;
    }

    try {
      notify('Redirection vers le paiement...');
      
      // Créer une session Stripe Checkout via le backend
      const response = await fetch(`${BACKEND_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: cart,
          customerInfo: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address: customerAddress,
            city: customerCity,
            postal: customerPostal,
          },
          userId: currentUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session de paiement');
      }

      const { url } = await response.json();

      // Rediriger vers Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Erreur commande:', error);
      notify('Erreur lors de la création du paiement');
    }
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

  // Sauvegarder un produit
  const saveProduct = async () => {
    if (!productName || !productClub || !productPrice || !productCost || !productImage) {
      notify('Veuillez remplir tous les champs et ajouter une image');
      return;
    }
    
    try {
      if (editingProduct) {
        const { data, error } = await supabase
          .from('products')
          .update({
            name: productName,
            club: productClub,
            price: parseFloat(productPrice),
            cost: parseFloat(productCost),
            category: productCategory,
            image: productImage,
            stock: parseInt(productStock)
          })
          .eq('id', editingProduct.id)
          .select();

        if (error) throw error;

        setProducts(products.map(p => p.id === editingProduct.id ? data[0] : p));
        notify('Produit modifié');
      } else {
        const newProduct = {
          name: productName,
          club: productClub,
          price: parseFloat(productPrice),
          cost: parseFloat(productCost),
          category: productCategory,
          image: productImage,
          stock: parseInt(productStock),
          rating: 4.5
        };

        const { data, error } = await supabase
          .from('products')
          .insert([newProduct])
          .select();

        if (error) throw error;

        setProducts([...products, data[0]]);
        notify('Produit ajouté');
      }
      setShowProductForm(false);
    } catch (error) {
      console.error('Erreur sauvegarde produit:', error);
      notify('Erreur lors de la sauvegarde');
    }
  };

  // Supprimer un produit
  const deleteProduct = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== id));
      notify('Produit supprimé');
    } catch (error) {
      console.error('Erreur suppression produit:', error);
      notify('Erreur lors de la suppression');
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
                    <LogOut size={16} /> Déconnexion
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

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
                  Pas de compte ? S'inscrire
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
                  <label className="block text-sm font-medium mb-2">Mot de passe (min 6 caractères)</label>
                  <input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
                <button onClick={handleRegister} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                  Créer mon compte
                </button>
                <button onClick={() => setAuthMode('login')} className="w-full text-sm text-blue-600 hover:underline">
                  Déjà un compte ? Se connecter
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
                    Découvrir
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
                  <label className={`cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center gap-2 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Upload size={18} />
                    {uploadingImage ? 'Upload en cours...' : 'Choisir une image'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
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
                  <label className="block text-sm font-medium mb-2">Catégorie</label>
                  <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600">
                    <option value="Domicile">Domicile</option>
                    <option value="Exterieur">Extérieur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stock</label>
                  <input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
              </div>
              {productPrice && productCost && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-700 font-semibold">Marge prévue: {(parseFloat(productPrice) - parseFloat(productCost)).toFixed(2)}€</p>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button onClick={saveProduct} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700" disabled={uploadingImage}>
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
                      <p className="text-xs text-gray-600 mb-2">Prix: {p.price}€ | Coût: {p.cost}€</p>
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
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-bold">Commandes ({orders.length})</h1>
                  <button 
                    onClick={loadOrders} 
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Actualiser
                  </button>
                </div>
                {orders.length === 0 ? (
                  <div className="bg-white rounded-lg p-12 text-center">
                    <p className="text-gray-500">Aucune commande</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => {
                      // Calculer le profit de manière sécurisée
                      const orderProfit = order.items?.reduce((sum, item) => {
                        const itemCost = item.cost || 0;
                        const itemPrice = item.price || 0;
                        const itemQty = item.quantity || 1;
                        return sum + ((itemPrice - itemCost) * itemQty);
                      }, 0) || 0;

                      return (
                        <div key={order.id} className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-lg">Commande #{order.id}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {order.status === 'paid' ? 'Payée' : 'En attente'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                📅 {new Date(order.created_at).toLocaleString('fr-FR')}
                              </p>
                              <p className="text-sm text-gray-600">
                                👤 {order.customer_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                📧 {order.customer_email}
                              </p>
                              <p className="text-sm text-gray-600">
                                📞 {order.customer_phone}
                              </p>
                              <p className="text-sm text-gray-600">
                                📍 {order.customer_address}, {order.customer_postal} {order.customer_city}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 mb-1">Total</p>
                              <p className="text-2xl font-bold text-blue-600">{order.total.toFixed(2)}€</p>
                              <p className="text-green-600 text-sm font-semibold mt-2">
                                💰 Profit: {orderProfit.toFixed(2)}€
                              </p>
                            </div>
                          </div>
                          
                          {/* Liste des produits */}
                          <div className="border-t pt-4 mt-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Articles commandés :</p>
                            <div className="space-y-2">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                  <div className="flex items-center gap-3">
                                    {item.image && (
                                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                    )}
                                    <div>
                                      <p className="font-medium text-sm">{item.name}</p>
                                      {item.size && <p className="text-xs text-gray-500">Taille: {item.size}</p>}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold">{item.quantity}x {item.price?.toFixed(2)}€</p>
                                    <p className="text-xs text-gray-500">= {(item.quantity * item.price).toFixed(2)}€</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Info Stripe */}
                          {order.stripe_session_id && (
                            <div className="border-t pt-3 mt-3">
                              <p className="text-xs text-gray-500">
                                💳 Session Stripe: <code className="bg-gray-100 px-2 py-1 rounded">{order.stripe_session_id}</code>
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                    <p className="text-2xl font-bold">{orders.reduce((s, o) => s + (o.total || 0), 0).toFixed(2)}€</p>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <BarChart className="text-orange-600 mb-2" size={32} />
                    <p className="text-gray-600">Profit</p>
                    <p className="text-2xl font-bold text-green-600">
                      {orders.reduce((totalProfit, order) => {
                        // Calculer le profit pour cette commande
                        const orderProfit = (order.items || []).reduce((sum, item) => {
                          const itemCost = item.cost || 0;
                          const itemPrice = item.price || 0;
                          const itemQty = item.quantity || 1;
                          return sum + ((itemPrice - itemCost) * itemQty);
                        }, 0);
                        return totalProfit + orderProfit;
                      }, 0).toFixed(2)}€
                    </p>
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
              <p className="text-xl mb-8">Les plus grands clubs européens</p>
              <button onClick={() => setPage('shop')} className="bg-white text-gray-900 px-8 py-3 rounded-lg font-bold">
                Découvrir
              </button>
            </div>
          </div>
        </section>
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Nos Produits</h2>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-xl">Aucun produit trouvé</p>
                <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 hover:underline">
                  Réinitialiser la recherche
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
                <p className="text-gray-500 text-xl">Aucun produit trouvé</p>
                <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 hover:underline">
                  Réinitialiser la recherche
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
                  <label className="block font-semibold mb-3">Quantité</label>
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
                  <span className="text-sm">Paiement sécurisé</span>
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
                      <input type="tel" placeholder="Téléphone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600" />
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
                  <h2 className="text-lg font-bold mb-4">RÉCAPITULATIF</h2>
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
              <h1 className="text-4xl font-bold mb-4">Commande confirmée !</h1>
              <p className="text-xl text-gray-600 mb-8">Merci pour votre achat</p>
              <button onClick={() => setPage('home')} className="bg-black text-white px-8 py-4 rounded-lg font-bold">
                RETOUR À L'ACCUEIL
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page de succès après paiement Stripe
  if (page === 'success') {
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
              <h1 className="text-4xl font-bold mb-4">Paiement réussi !</h1>
              <p className="text-xl text-gray-600 mb-4">Merci pour votre achat</p>
              <p className="text-gray-600 mb-8">
                Un email de confirmation a été envoyé à votre adresse.
                <br />
                Votre commande sera traitée dans les plus brefs délais.
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => {
                    // Nettoyer l'URL
                    window.history.replaceState({}, '', '/');
                    // Retourner à l'accueil
                    setPage('home');
                  }} 
                  className="bg-black text-white px-8 py-4 rounded-lg font-bold hover:bg-gray-800"
                >
                  RETOUR À L'ACCUEIL
                </button>
                {currentUser?.isAdmin && (
                  <button 
                    onClick={() => { 
                      window.history.replaceState({}, '', '/');
                      setPage('admin'); 
                      setAdminTab('orders'); 
                    }} 
                    className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700"
                  >
                    VOIR LES COMMANDES
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div><Header /></div>;
}
