import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function MainLayout() {
  return (
    <>
      <Navbar />
      <main>
        {/* Your child routes (StallPage, HomePage, etc.) 
            will be rendered here */}
        <Outlet /> 
      </main>
    </>
  );
}

export default MainLayout;