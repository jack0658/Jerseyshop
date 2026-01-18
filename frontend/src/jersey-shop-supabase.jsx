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
// eslint-disable-next-line no-unused-vars
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');

const ADMIN_EMAIL = "admin@jerseyshop.com";

const CATEGORIES = ["Électronique", "Mode", "Accessoires", "Sport & Fitness", "Maison & Déco", "Beauté & Santé", "Gadgets"];

export default function Nexora() {
  const [page, setPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('nexora_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
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
  const [productBrand, setProductBrand] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productCategory, setProductCategory] = useState('Électronique');
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

  // Sauvegarder le panier dans localStorage
  useEffect(() => {
    localStorage.setItem('nexora_cart', JSON.stringify(cart));
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
      
      setPage('success');
      
      fetch(`${BACKEND_URL}/checkout-session/${sessionId}`)
        .then(res => res.json())
        .then(session => {
          console.log('✅ Session vérifiée:', session);
          if (session.payment_status === 'paid') {
            setCart([]);
            setCustomerName('');
            setCustomerEmail('');
            setCustomerPhone('');
            setCustomerAddress('');
            setCustomerCity('');
            setCustomerPostal('');
            
            loadOrders();
            window.history.replaceState({}, '', '/');
          }
        })
        .catch(err => console.error('❌ Erreur vérification session:', err));
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vérifier l'utilisateur connecté
  const checkUser = async () => {
    try {
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

  // Charger les produits
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

  // Charger les commandes
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
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // Upload d'image vers Supabase Storage
  const uploadImage = async (file) => {
    if (!file) return;

    try {
      setUploadingImage(true);
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

  // Connexion
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

  // Inscription
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

      if (data.user && !data.session) {
        notify('📧 Vérifiez votre email pour confirmer votre compte');
        setShowAuth(false);
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPassword('');
        return;
      }

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
    const cartItem = {
      ...product,
      size,
      quantity: qty,
      cartId: `${product.id}-${size}-${Date.now()}`
    };
    setCart([...cart, cartItem]);
    notify('Produit ajouté au panier');
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
      window.location.href = url;
    } catch (error) {
      console.error('Erreur commande:', error);
      notify('Erreur lors de la création du paiement');
    }
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductName('');
    setProductBrand('');
    setProductPrice('');
    setProductCost('');
    setProductCategory('Électronique');
    setProductImage('');
    setProductStock('100');
    setImagePreview('');
    setShowProductForm(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductBrand(product.brand || '');
    setProductPrice(product.price.toString());
    setProductCost(product.cost.toString());
    setProductCategory(product.category);
    setProductImage(product.image);
    setProductStock(product.stock.toString());
    setImagePreview(product.image);
    setShowProductForm(true);
  };

  const saveProduct = async () => {
    if (!productName || !productBrand || !productPrice || !productCost || !productImage) {
      notify('Veuillez remplir tous les champs');
      return;
    }

    try {
      const productData = {
        name: productName,
        brand: productBrand,
        price: parseFloat(productPrice),
        cost: parseFloat(productCost),
        category: productCategory,
        image: productImage,
        stock: parseInt(productStock),
        rating: 4.5
      };

      if (editingProduct) {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select();

        if (error) throw error;
        setProducts(products.map(p => p.id === editingProduct.id ? data[0] : p));
        notify('Produit modifié');
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Chargement de Nexora...</p>
        </div>
      </div>
    );
  }

  // Header Component
  const Header = () => (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 
              onClick={() => setPage('home')} 
              className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform"
            >
              NEXORA
            </h1>
            <nav className="hidden md:flex gap-6">
              <button onClick={() => setPage('home')} className="text-gray-700 hover:text-indigo-600 font-medium transition">Accueil</button>
              <button onClick={() => setPage('shop')} className="text-gray-700 hover:text-indigo-600 font-medium transition">Boutique</button>
              {currentUser?.isAdmin && (
                <button onClick={() => setPage('admin')} className="text-indigo-600 hover:text-indigo-700 font-bold transition">Administration</button>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => page !== 'shop' && setPage('shop')}
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button onClick={() => setShowCart(true)} className="relative p-2 hover:bg-gray-100 rounded-full transition">
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getCount()}
                </span>
              )}
            </button>
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <User size={24} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-2 border-b">
                        <p className="font-semibold text-sm">{currentUser.name}</p>
                        <p className="text-xs text-gray-500">{currentUser.email}</p>
                      </div>
                      {currentUser.isAdmin && (
                        <button 
                          onClick={() => { 
                            setPage('admin'); 
                            setShowUserMenu(false); 
                          }} 
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-indigo-600 font-semibold"
                        >
                          <Shield size={16} /> Administration
                        </button>
                      )}
                      <button onClick={logout} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                        <LogOut size={16} /> Déconnexion
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setShowAuth(true); setShowUserMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-50">
                      Se connecter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {notification && (
        <div className="fixed top-20 right-4 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}
    </header>
  );

  // Panier
  if (showCart) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
            <h2 className="text-2xl font-bold">Panier ({getCount()})</h2>
            <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Votre panier est vide</p>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.cartId} className="flex gap-4 p-4 border rounded-lg">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-lg font-bold text-indigo-600">{item.price}€</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => removeFromCart(item.cartId)} className="text-red-600 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} className="p-1 hover:bg-gray-100 rounded">
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} className="p-1 hover:bg-gray-100 rounded">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <div className="p-6 border-t bg-gray-50 sticky bottom-0">
              <div className="flex justify-between mb-4">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-indigo-600">{getTotal()}€</span>
              </div>
              <button 
                onClick={() => { setShowCart(false); setPage('checkout'); }} 
                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                Commander
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modal Auth
  if (showAuth) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{authMode === 'login' ? 'Connexion' : 'Inscription'}</h2>
            <button onClick={() => setShowAuth(false)} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={24} />
            </button>
          </div>
          {authMode === 'login' ? (
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={handleLogin} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">
                Se connecter
              </button>
              <p className="text-center text-sm">
                Pas de compte ? 
                <button onClick={() => setAuthMode('register')} className="text-indigo-600 hover:underline ml-1">
                  S'inscrire
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                placeholder="Mot de passe (min 6 caractères)"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={handleRegister} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">
                Créer mon compte
              </button>
              <p className="text-center text-sm">
                Déjà un compte ? 
                <button onClick={() => setAuthMode('login')} className="text-indigo-600 hover:underline ml-1">
                  Se connecter
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pages du site...
  // (Le reste du code continue avec les pages admin, shop, product, checkout, confirmation, success)
  // Pour garder la réponse concise, je vais juste montrer les changements clés

  if (page === 'admin') {
    if (!currentUser?.isAdmin) {
      return (
        <div>
          <Header />
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Accès refusé</h1>
            <p className="text-gray-600">Vous devez être administrateur</p>
            <button onClick={() => setPage('home')} className="mt-4 text-indigo-600 hover:underline">
              Retour à l'accueil
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Administration Nexora</h1>
            
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="flex border-b overflow-x-auto">
                <button onClick={() => setAdminTab('products')} className={`py-4 px-6 font-semibold ${adminTab === 'products' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}>
                  Produits
                </button>
                <button onClick={() => setAdminTab('orders')} className={`py-4 px-6 font-semibold ${adminTab === 'orders' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}>
                  Commandes
                </button>
                <button onClick={() => setAdminTab('stats')} className={`py-4 px-6 font-semibold ${adminTab === 'stats' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}>
                  Statistiques
                </button>
              </div>

              <div className="p-6">
                {adminTab === 'products' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Gestion des produits</h2>
                      <button onClick={openAddProduct} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2">
                        <Plus size={20} /> Ajouter un produit
                      </button>
                    </div>

                    {showProductForm && (
                      <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Modifier' : 'Nouveau'} produit</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Nom du produit</label>
                            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-indigo-600" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Marque</label>
                            <input type="text" value={productBrand} onChange={(e) => setProductBrand(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-indigo-600" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Prix de vente (€)</label>
                            <input type="number" step="0.01" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-indigo-600" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Prix d'achat (€)</label>
                            <input type="number" step="0.01" value={productCost} onChange={(e) => setProductCost(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-indigo-600" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Catégorie</label>
                            <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-indigo-600">
                              {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Stock</label>
                            <input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-indigo-600" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Image (URL ou upload)</label>
                            <div className="flex gap-4">
                              <input type="text" value={productImage} onChange={(e) => { setProductImage(e.target.value); setImagePreview(e.target.value); }} placeholder="URL de l'image" className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:border-indigo-600" />
                              <label className="bg-gray-200 px-6 py-3 rounded-lg font-bold cursor-pointer hover:bg-gray-300 flex items-center gap-2">
                                <Upload size={20} />
                                {uploadingImage ? 'Upload...' : 'Upload'}
                                <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files[0])} className="hidden" disabled={uploadingImage} />
                              </label>
                            </div>
                            {imagePreview && (
                              <img src={imagePreview} alt="Preview" className="mt-4 w-32 h-32 object-cover rounded-lg" />
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 mt-6">
                          <button onClick={saveProduct} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700">
                            Enregistrer
                          </button>
                          <button onClick={() => setShowProductForm(false)} className="bg-gray-300 px-8 py-3 rounded-lg font-bold hover:bg-gray-400">
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-4">
                      {products.map(p => (
                        <div key={p.id} className="bg-white border rounded-lg p-4">
                          <img src={p.image} alt={p.name} className="w-full h-40 object-cover rounded-lg mb-3" />
                          <h3 className="font-semibold text-sm mb-1">{p.name}</h3>
                          <p className="text-xs text-gray-600 mb-2">{p.brand} • {p.category}</p>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-lg font-bold text-indigo-600">{p.price}€</span>
                            <span className="text-xs text-gray-500">Stock: {p.stock}</span>
                          </div>
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
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"
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
                                  <p className="text-sm text-gray-600">📅 {new Date(order.created_at).toLocaleString('fr-FR')}</p>
                                  <p className="text-sm text-gray-600">👤 {order.customer_name}</p>
                                  <p className="text-sm text-gray-600">📧 {order.customer_email}</p>
                                  <p className="text-sm text-gray-600">📞 {order.customer_phone}</p>
                                  <p className="text-sm text-gray-600">📍 {order.customer_address}, {order.customer_postal} {order.customer_city}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500 mb-1">Total</p>
                                  <p className="text-2xl font-bold text-indigo-600">{order.total.toFixed(2)}€</p>
                                  <p className="text-green-600 text-sm font-semibold mt-2">💰 Profit: {orderProfit.toFixed(2)}€</p>
                                </div>
                              </div>
                              
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
                        <Package className="text-indigo-600 mb-2" size={32} />
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
        </div>
      </div>
    );
  }

  if (page === 'home') {
    return (
      <div>
        <Header />
        <section className="relative h-96 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-4 h-full flex items-center relative z-10">
            <div className="text-white max-w-2xl">
              <h1 className="text-6xl font-black mb-4 animate-fade-in">Découvrez Nexora</h1>
              <p className="text-xl mb-8 opacity-90">Les meilleurs produits sélectionnés pour vous</p>
              <button onClick={() => setPage('shop')} className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition transform hover:scale-105">
                Explorer la boutique
              </button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Produits Populaires</h2>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-xl">Aucun produit disponible</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-6">
                {filteredProducts.slice(0, 8).map(p => (
                  <div key={p.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer flex flex-col overflow-hidden group" onClick={() => { setSelectedProduct(p); setPage('product'); }}>
                    <div className="h-64 w-full overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                      <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-indigo-600 font-semibold mb-1">{p.category}</p>
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{p.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{p.brand}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-indigo-600">{p.price}€</span>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">{p.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} className="text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Paiement Sécurisé</h3>
                <p className="text-gray-600">Vos transactions sont protégées par Stripe</p>
              </div>
              <div>
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={32} className="text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Livraison Rapide</h3>
                <p className="text-gray-600">Expédition sous 24-48h</p>
              </div>
              <div>
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star size={32} className="text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Qualité Premium</h3>
                <p className="text-gray-600">Produits soigneusement sélectionnés</p>
              </div>
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
        <div className="bg-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-8">Boutique</h1>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-xl">Aucun produit trouvé</p>
                <button onClick={() => setSearchTerm('')} className="mt-4 text-indigo-600 hover:underline">
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-6">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer flex flex-col overflow-hidden group" onClick={() => { setSelectedProduct(p); setPage('product'); }}>
                    <div className="h-64 w-full overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                      <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-indigo-600 font-semibold mb-1">{p.category}</p>
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{p.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{p.brand}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-indigo-600">{p.price}€</span>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">{p.rating}</span>
                        </div>
                      </div>
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

  // Page produit
  if (page === 'product' && selectedProduct) {
    return (
      <div>
        <Header />
        <div className="bg-gray-50 min-h-screen py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <button onClick={() => setPage('shop')} className="text-indigo-600 hover:underline mb-6 flex items-center gap-2">
              ← Retour à la boutique
            </button>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="h-96 w-full bg-gray-100 flex items-center justify-center">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="max-h-full max-w-full object-contain p-8" />
                </div>
                <div className="p-8">
                  <p className="text-indigo-600 font-semibold mb-2">{selectedProduct.category}</p>
                  <h1 className="text-4xl font-bold mb-2">{selectedProduct.name}</h1>
                  <p className="text-gray-600 mb-4">{selectedProduct.brand}</p>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={20} className={i < Math.floor(selectedProduct.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                    <span className="text-gray-600">({selectedProduct.rating})</span>
                  </div>
                  <p className="text-4xl font-bold text-indigo-600 mb-8">{selectedProduct.price}€</p>
                  
                  <div className="mb-8">
                    <label className="block font-semibold mb-3">Quantité</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 border-2 border-gray-300 rounded-lg hover:border-gray-400">
                        <Minus size={20} />
                      </button>
                      <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="p-2 border-2 border-gray-300 rounded-lg hover:border-gray-400">
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(selectedProduct, 'Unique', quantity)}
                    className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={24} />
                    Ajouter au panier - {(selectedProduct.price * quantity).toFixed(2)}€
                  </button>

                  <div className="mt-8 pt-8 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Stock:</span> {selectedProduct.stock} disponibles
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page checkout
  if (page === 'checkout') {
    return (
      <div>
        <Header />
        <div className="bg-gray-50 min-h-screen py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Finaliser la commande</h1>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6">Informations de livraison</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Ville"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Code postal"
                      value={customerPostal}
                      onChange={(e) => setCustomerPostal(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white rounded-2xl p-8 mb-4">
                  <h2 className="text-2xl font-bold mb-6">Récapitulatif</h2>
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item.cartId} className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity}x</p>
                        </div>
                        <p className="font-bold">{(item.price * item.quantity).toFixed(2)}€</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-3xl font-bold text-indigo-600">{getTotal()}€</span>
                  </div>
                </div>
                <button
                  onClick={placeOrder}
                  className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition"
                >
                  Payer avec Stripe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page succès
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
              <p className="text-xl text-gray-600 mb-4">Merci pour votre achat sur Nexora</p>
              <p className="text-gray-600 mb-8">
                Un email de confirmation a été envoyé à votre adresse.
                <br />
                Votre commande sera traitée dans les plus brefs délais.
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => {
                    window.history.replaceState({}, '', '/');
                    setPage('home');
                  }} 
                  className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-indigo-700"
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
