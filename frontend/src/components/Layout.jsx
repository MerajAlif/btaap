import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  const location = useLocation();
  const path = location.pathname;

  // Logic to hide Navbar/Footer for community detail pages
  // Path format: /communities/:id
  // We want to show Navbar for: /, /communities, /communities/create
  // We want to HIDE Navbar for: /communities/:id (where id is a mongo ID)

  const isCommunityDetail = path.startsWith('/communities/') &&
    path !== '/communities' &&
    path !== '/communities/create';

  return (
    <>
      {!isCommunityDetail && <Navbar />}
      <main className={!isCommunityDetail ? "container mx-auto" : ""}>
        {children}
      </main>
      {!isCommunityDetail && <Footer />}
    </>
  );
}