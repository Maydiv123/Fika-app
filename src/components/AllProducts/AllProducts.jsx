import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { FaShoppingBag, FaHeart, FaShoppingCart, FaEye, FaTimes, FaRegHeart, FaTshirt, FaSearch, FaChevronRight, FaStar, FaStarHalfAlt, FaRegStar, FaFilter, FaSort, FaTags, FaArrowRight, FaSlidersH, FaDollarSign, FaSortAmountDown, FaBed, FaCouch, FaGift } from "react-icons/fa";
import { GiLargeDress, GiRunningShoe, GiWatch, GiHeartNecklace, GiTrousers } from "react-icons/gi";
import "./AllProductsStyles.css";
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

// Category and sub-category mapping
const CATEGORY_SUBCATEGORIES = {
  "Cushions": ["Cushion Cover"],
  "Bedsets": ["Bedcover", "Bedsheet"],
  "Dohars & Quilts": ["Baby Quilts", "Dohar", "Quilt"],
  "Wish Genie": ["Scented Candles", "Crystal Jewellery", "Journals"],
  "Men's Shirts": ["Formal Shirts", "Casual Shirts", "Denim Shirts", "Printed Shirts", "Linen Shirts"]
};

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [sortOption, setSortOption] = useState("featured");
  const [visibleItems, setVisibleItems] = useState(12);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const [minRating, setMinRating] = useState(0);
  const [showDiscounted, setShowDiscounted] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsArr = [];
        querySnapshot.forEach((doc) => {
          productsArr.push({ id: doc.id, ...doc.data() });
        });
        setProducts(productsArr);
        setError(null);
      } catch (err) {
        setError('Error fetching products. Please try again later.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  console.log('Products data:', products);

  // Get sub-categories for the selected category
  const subCategories = CATEGORY_SUBCATEGORIES[selectedCategory] || [];

  // Filter products based on selected category and sub-category
  const filteredProducts = products.filter(product => {
    const matchCategory = selectedCategory === "All Products" || product.category === selectedCategory;
    const matchSubCategory = !selectedSubCategory || product.sub_category === selectedSubCategory;
    const matchPrice = Number(product.mrp) >= priceRange[0] && Number(product.mrp) <= priceRange[1];
    const matchStock = !inStockOnly || Number(product.inventory) > 0;
    const hasImage = product.image && product.image.trim() !== '';
    return matchCategory && matchSubCategory && matchPrice && matchStock && hasImage;
  });

  useEffect(() => {
    setFadeIn(true);
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    // Add click outside listener
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const categories = [
    { id: "all", name: "All Products", icon: <FaShoppingBag /> },
    { id: "Cushion Covers", name: "Cushion Covers", icon: <FaCouch /> },
    { id: "Bedsets", name: "Bedsets", icon: <FaBed /> },
    { id: "Dohars & Quilts", name: "Dohars & Quilts", icon: <FaBed /> },
    { id: "Bags & Pouches", name: "Bags & Pouches", icon: <FaTshirt /> },
    { id: "wish-genie", name: "Wish Genie", icon: <FaGift /> },
  ];

  const sortOptions = [
    { id: "featured", name: "Featured" },
    { id: "newest", name: "Newest" },
    { id: "priceAsc", name: "Price: Low to High" },
    { id: "priceDesc", name: "Price: High to Low" },
    { id: "nameAsc", name: "Name: A-Z" },
    { id: "nameDesc", name: "Name: Z-A" },
  ];

  // Count products per category
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat.id] = products.filter(
      (product) => {
        const hasImage = product.image && product.image.trim() !== '';
        return (cat.id === 'all' || product.category.toLowerCase() === cat.id.toLowerCase()) && hasImage;
      }
    ).length;
    return acc;
  }, {});

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case "newest":
        return new Date(b.created_at) - new Date(a.created_at);
      case "priceAsc":
        return Number(a.mrp) - Number(b.mrp);
      case "priceDesc":
        return Number(b.mrp) - Number(a.mrp);
      case "nameAsc":
        return a.product_name.localeCompare(b.product_name);
      case "nameDesc":
        return b.product_name.localeCompare(a.product_name);
      default:
        return 0;
    }
  });

  const handleLoadMore = () => {
    setVisibleItems((prev) => prev + 8);
  };

  const handleImageClick = (image, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already being applied through the filteredProducts
  };

  const handleAddToCartClick = (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    addToCart(product);
    setToastMessage(`{product.name} added to cart!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddToWishlistClick = (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleQuickView = (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setQuickView(product);
  };

  const closeQuickView = () => {
    setQuickView(null);
  };

  const handlePriceChange = (e, index) => {
    const newRange = [...priceRange];
    newRange[index] = parseInt(e.target.value);
    setPriceRange(newRange);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star-icon filled" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star-icon filled" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star-icon" />);
    }
    
    return stars;
  };

  // Update the category click handler
  const handleCategoryClick = (category) => {
    if (category.name === "Wish Genie") {
      navigate('/new-arrivals-wish');
      return;
    }
    setSelectedCategory(category.name);
    setSelectedSubCategory("");
    setVisibleItems(12);
  };

  return (
    <section className={`products-section ${fadeIn ? 'fade-in' : ''}`}>
      {loading && (
        <div className="loading-spinner">
          Loading products...
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div className="products-toast">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="products-container">
        {/* Hero Header */}
        <div className="products-header" style={{flexDirection:'column'}}>
          <div className="animated-title">
            {Array.from("Our Collection").map((letter, index) => (
              <span key={index} className={letter === ' ' ? 'space' : ''} style={{ animationDelay: `${0.1 * index}s` }}>
                {letter === ' ' ? '\u00A0' : letter}
              </span>
            ))}
          </div>
          <div className="products-subtitle">
            Discover our curated selection of premium fashion items designed for style and comfort
          </div>
          <div className="products-divider"></div>
        </div>

        {/* Horizontal Category Bar */}
        <div className="category-bar-horizontal">
          {categories.map((category) => (
            <button
              key={category.name}
              className={`category-btn-horizontal ${selectedCategory === category.name ? "active" : ""}`}
              onClick={() => handleCategoryClick(category)}
            >
              <span className="category-icon-horizontal">{category.icon}</span>
              {category.name} 
              {category.name !== "Wish Genie" && (
                <span style={{color:'#888',fontWeight:400}}>({categoryCounts[category.id]})</span>
              )}
            </button>
          ))}
        </div>

        <div className="products-main-content">
          {/* Side Filters Panel */}
          <div className={`products-filters ${filtersVisible ? 'visible' : ''}`}>
            <div className="filters-header">
              <h3><FaSlidersH /> Filters</h3>
              <button className="close-filters" onClick={() => setFiltersVisible(false)}>×</button>
            </div>
            {/* Show sub-category dropdown if a main category is selected, else show rating filter */}
            {selectedCategory !== "All Products" && selectedCategory !== "Wish Genie" && subCategories.length > 0 ? (
              <div className="filter-group">
                <h4>Sub-category</h4>
                <div className="subcategory-options">
                  <label className="subcategory-checkbox">
                    <input
                      type="radio"
                      name="subCategory"
                      value=""
                      checked={selectedSubCategory === ""}
                      onChange={() => setSelectedSubCategory("")}
                    />
                    <span>All</span>
                  </label>
                  {subCategories.map((sub) => (
                    <label key={sub} className="subcategory-checkbox">
                      <input
                        type="radio"
                        name="subCategory"
                        value={sub}
                        checked={selectedSubCategory === sub}
                        onChange={() => setSelectedSubCategory(sub)}
                      />
                      <span>{sub}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              selectedCategory === "Wish Genie" && subCategories.length > 0 ? (
                <div className="filter-group wish-genie-subcategories">
                  <h4>Sub-category</h4>
                  <div className="subcategory-options">
                    <label className="subcategory-checkbox">
                      <input
                        type="radio"
                        name="subCategory"
                        value=""
                        checked={selectedSubCategory === ""}
                        onChange={() => setSelectedSubCategory("")}
                      />
                      <span>All</span>
                    </label>
                    {subCategories.map((sub) => (
                      <label key={sub} className="subcategory-checkbox">
                        <input
                          type="radio"
                          name="subCategory"
                          value={sub}
                          checked={selectedSubCategory === sub}
                          onChange={() => setSelectedSubCategory(sub)}
                        />
                        <span>{sub}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                selectedCategory !== "Wish Genie" && (
                  <div className="filter-group">
                    <h4><FaStar /> Minimum Rating</h4>
                    <div className="rating-options">
                      {[4, 3, 2, 1].map((star) => (
                        <label key={star} className="rating-checkbox">
                          <input
                            type="radio"
                            name="minRating"
                            value={star}
                            checked={minRating === star}
                            onChange={() => setMinRating(star)}
                          />
                          {star} stars & up
                        </label>
                      ))}
                      <label className="rating-checkbox">
                        <input
                          type="radio"
                          name="minRating"
                          value={0}
                          checked={minRating === 0}
                          onChange={() => setMinRating(0)}
                        />
                        Any
                      </label>
                    </div>
                  </div>
                )
              )
            )}
            
            {/* On Sale & In Stock Only */}
            <div className="filter-group">
              <div className="filter-checkbox-group">
                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={showDiscounted}
                    onChange={() => setShowDiscounted((v) => !v)}
                  />
                  <span>On Sale</span>
                </label>
                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={() => setInStockOnly((v) => !v)}
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>
            
            {/* Price Range */}
            <div className="filter-group">
              <h4>Price Range</h4>
              <input
                type="range"
                min="0"
                max="10000"
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="price-slider"
              />
              <div className="price-range-display">
                <span>₹{priceRange[0]}</span>
                <span>₹{priceRange[1]}</span>
              </div>
            </div>
            
            {/* Sort By */}
            <div className="filter-group">
              <h4><FaSortAmountDown /> Sort By</h4>
              <select
                className="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Clear All Filters Button */}
            <button className="reset-filters-btn" style={{marginTop:16, width:'100%'}}
              onClick={() => {
                setSelectedCategory('All Products');
                setSelectedSubCategory('');
                setMinRating(0);
                setShowDiscounted(false);
                setInStockOnly(false);
                setPriceRange([0, 10000]);
                setSortOption('featured');
              }}
            >
              Clear All Filters
            </button>
          </div>

          {/* Main Products Grid */}
          <div className="products-content">
            <div className="products-result-stats">
              <div className="results-count">
                Showing {Math.min(visibleItems, sortedProducts.length)} of {sortedProducts.length} products
              </div>
              <div className="sort-mobile">
                <button className="sort-btn" onClick={() => setFiltersVisible(true)}>
                  <FaSort /> Sort
                </button>
                {filtersVisible && (
                  <div className="mobile-sort-dropdown">
                    <div className="mobile-sort-header">
                      <h4><FaSortAmountDown /> Sort By</h4>
                      <button className="close-sort" onClick={() => setFiltersVisible(false)}>
                        <FaTimes />
                      </button>
                    </div>
                    <div className="mobile-sort-options">
                      {sortOptions.map((option) => (
                        <button
                          key={option.id}
                          className={`mobile-sort-option ${sortOption === option.id ? 'active' : ''}`}
                          onClick={() => {
                            setSortOption(option.id);
                            setFiltersVisible(false);
                          }}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="products-grid">
              {sortedProducts.slice(0, visibleItems).map((product) => {
                // Parse the image field for the first image
                let firstImage = '';
                if (product.image) {
                  const imagesArr = product.image.split(',').map(img => img.trim()).filter(Boolean);
                  if (imagesArr.length > 0) {
                    firstImage = imagesArr[0].startsWith('/') ? imagesArr[0] : `/${imagesArr[0]}`;
                  }
                }
                return (
                  <div 
                    key={product.id} 
                    className="product-card"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="product-image-container">
                      <img 
                        src={firstImage} 
                        alt={product.product_name} 
                        className="product-image" 
                        loading="lazy" 
                      />
                      
                      <div className="product-actions">
                        <button 
                          className="product-action-btn cart-btn"
                          onClick={(e) => handleAddToCartClick(product, e)}
                          title="Add to Cart"
                          disabled={product.inventory <= 0}
                        >
                          <FaShoppingCart />
                        </button>
                        <button 
                          className={`product-action-btn wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}`}
                          onClick={(e) => handleAddToWishlistClick(product, e)}
                          title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                        >
                          {isInWishlist(product.id) ? <FaHeart /> : <FaRegHeart />}
                        </button>
                        <button 
                          className="product-action-btn quickview-btn"
                          onClick={(e) => handleQuickView(product, e)}
                          title="Quick View"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </div>
                    
                    <div className="product-info">
                      <h3 className="product-name">{product.product_name}</h3>
                      <p className="product-category">{product.category} - {product.sub_category}</p>
                      <div className="product-price">
                        <span className="current-price">
                          ₹{Number(product.mrp).toFixed(2)}
                        </span>
                      </div>
                      
                      <button className="shop-now-btn">
                        Shop Now <FaArrowRight className="" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleItems < sortedProducts.length && (
              <div className="load-more-container">
                <button className="load-more-btn" onClick={handleLoadMore}>
                  Load More Products...
                </button>
              </div>
            )}

            {sortedProducts.length === 0 && (
              <div className="no-products-found">
                <div className="empty-state">
                  <FaShoppingBag className="empty-icon" />
                  <h3>No products found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                  <button 
                    className="reset-filters-btn"
                    onClick={() => {
                      setSelectedCategory("All Products");
                      setSelectedSubCategory("");
                      setSearchQuery("");
                      setPriceRange([0, 10000]);
                    }}
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="image-modal" onClick={handleCloseModal}>
            <div className="modal-content">
              <button className="close-modal" onClick={handleCloseModal}>
                ×
              </button>
              <img src={selectedImage} alt="Product Preview" />
            </div>
          </div>
        )}

        {/* Quick View Modal */}
        <div
          className={`quickview-modal ${quickView ? "active" : ""}`}
          onClick={closeQuickView}
        >
          {quickView && (
            <div
              className="quickview-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="quickview-close" onClick={closeQuickView}>
                <FaTimes />
              </button>
              
              <div className="quickview-grid">
                <div className="quickview-image">
                  <img src={quickView.image} alt={quickView.name} />
                  {quickView.discount && (
                    <div className="quickview-badge">-{quickView.discount}%</div>
                  )}
                </div>
                
                <div className="quickview-details">
                  <h2 className="quickview-name">{quickView.name}</h2>
                  
                  <div className="quickview-category">
                    <FaTags className="category-icon" />
                    {quickView.category.charAt(0).toUpperCase() + quickView.category.slice(1)}
                  </div>
                  
                  <div className="quickview-price">
                    {quickView.discount ? (
                      <>
                        <span className="current-price">
                          ₹{(quickView.price * (1 - quickView.discount / 100)).toFixed(2)}
                        </span>
                        <span className="original-price">
                          ₹{quickView.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="current-price">₹{quickView.price.toFixed(2)}</span>
                    )}
                  </div>
                  
                  {quickView.rating && (
                    <div className="quickview-rating">
                      <div className="stars">
                        {renderStars(quickView.rating)}
                      </div>
                      {quickView.reviewsCount && (
                        <span className="reviews-count">({quickView.reviewsCount} reviews)</span>
                      )}
                    </div>
                  )}
                  
                  <div className="quickview-description">
                    {quickView.description || 
                      "This premium product combines style, comfort and durability. Perfect for everyday use and special occasions alike."}
                  </div>
                  
                  {quickView.sizes && (
                    <div className="quickview-sizes">
                      <h4>Available Sizes</h4>
                      <div className="size-options">
                        {quickView.sizes.map((size, index) => (
                          <span key={index} className="size-option">{size}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {quickView.colors && (
                    <div className="quickview-colors">
                      <h4>Available Colors</h4>
                      <div className="color-options">
                        {quickView.colors.map((color, index) => (
                          <div 
                            key={index} 
                            className="color-option"
                            style={{ backgroundColor: color.toLowerCase() }}
                            title={color}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="quickview-actions">
                    <button
                      className="add-to-cart-btn"
                      onClick={() => {
                        handleAddToCartClick(quickView);
                        closeQuickView();
                      }}
                    >
                      <FaShoppingCart /> Add to Cart
                    </button>
                    
                    <button
                      className={`add-to-wishlist-btn ${isInWishlist(quickView.id) ? 'active' : ''}`}
                      onClick={() => handleAddToWishlistClick(quickView)}
                    >
                      {isInWishlist(quickView.id) ? <FaHeart /> : <FaRegHeart />}
                      {isInWishlist(quickView.id) ? 'In Wishlist' : 'Add to Wishlist'}
                    </button>
                  </div>
                  
                  <Link
                    to={`/product/${quickView.id}`}
                    className="view-details-btn"
                    onClick={closeQuickView}
                  >
                    View Full Details <FaChevronRight className="arrow-icon" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AllProducts;
