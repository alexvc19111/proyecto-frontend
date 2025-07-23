// src/components/Layout.jsx
import React from "react";
import Navbar from "./navbar";
import { Outlet } from "react-router-dom";


export default function Layout() {
  return (
    <div className="flex h-screen">
              <Navbar />
      <main className="flex-1 overflow-auto p-6 bg-gray-100">
                <Outlet />

      </main>
    </div>
  );
}
