import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../StallPhotos.css';

function StallPhotos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [stallName, setStallName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStallImages() {
      try {
        setLoading(true);
        const [photoResponse, stallResponse] = await Promise.all([
          fetch(`http://localhost:3000/stalls/${id}/photos`),
          fetch(`http://localhost:3000/stalls/${id}`)
        ]);
        
        if (!photoResponse.ok || !stallResponse.ok) {
          throw new Error('Could not fetch stall photos or stall details.');
        }
        
        const photoData = await photoResponse.json();
        const stallData = await stallResponse.json();
        setImages(photoData);
        setStallName(stallData.StallName);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStallImages();
  }, [id]);

  let content;
  if (loading) {
    content = <p>Loading photos...</p>;
  } else if (error) {
    content = <p>Error: {error}</p>;
  } else if (images.length === 0) {
    content = <p>No photos have been uploaded for this stall yet.</p>;
  } else {
    content = (
      <div className="photo-grid">
        {images.map(image => (
          <div key={image.ImageID} className="photo-card">
            <img src={image.ImageURL} alt={image.MenuItemName || 'Stall Photo'} className="photo-img" />
            <p className="photo-caption">For: {image.MenuItemName}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="photo-page-wrapper">
      <div className="photo-page-container">
        <div className="photo-header">
          <button onClick={() => navigate(`/stalls/${id}`)} className="back-button">
            &larr; Back to Stall
          </button>
          <h1 className="photo-title">
            {stallName ? `${stallName} - Photos` : 'Photos'}
          </h1>
        </div>
        {content}
      </div>
    </div>
  );
}

export default StallPhotos;