// 1. Fixed this line: removed extra 'use' and added 'useNavigate'
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import '../Product.css';
import hero from '../assets/hero.png'; 

function Product() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 2. This line will now work because it's imported
  const navigate = useNavigate(); 

  useEffect(() => {
    async function fetchItemData() {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/menu-item/${itemId}`);
        
        if (!response.ok) {
          throw new Error('Menu item not found');
        }
        
        const data = await response.json();
        setItem(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchItemData();
  }, [itemId]);

  if (loading) {
    return <div className="product-wrapper"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="product-wrapper"><p>Error: {error}</p></div>;
  }

  if (!item) {
    return <div className="product-wrapper"><p>Item not found.</p></div>;
  }

  return (
    <div className="product-wrapper">
      {/* 3. Changed this className to 'product-layout' to match your CSS */}
      <div className="product-layout"> 
        
        <div className="back-button-container">
            <button onClick={() => navigate(-1)} className="back-button">
                &larr; Back to Stall
            </button>
        </div>

        <div className="product-image-frame">
          <img 
            src={item.MainImageURL || hero} 
            alt={item.Name} 
            className="product-image"
          />
        </div>

        <div className="product-info">
            <h1 className="product-name">{item.Name}</h1>
            <p className="product-price">${parseFloat(item.Price).toFixed(2)}</p>
            <p className="product-description">{item.Description}</p>
            {/* Add to cart to be added here */}
        </div>
      </div>
    </div>
  );
}

export default Product;