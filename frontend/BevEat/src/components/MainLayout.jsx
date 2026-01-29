import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function MainLayout() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <Navbar />
      <main>
        {/* Your child routes (StallPage, HomePage, etc.) 
            will be rendered here */}
        <Outlet /> 
      </main>
      {showButton && (
        <button 
          onClick={scrollToTop} 
          className="back-to-top"
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </>
  );
}

export default MainLayout;