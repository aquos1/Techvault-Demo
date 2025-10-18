'use client';

import { useState } from 'react';
import Link from 'next/link';
import CartDrawer from './CartDrawer';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

export default function Header({ cartCount, onCartClick }: HeaderProps) {
  return (
    <>
      {/* Top bar with delivery info */}
      <div className="bg-amazon-dark text-white text-sm py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-white">TechVault</span>
                <span className="text-xs text-gray-300 ml-1">prime</span>
              </Link>
              <div className="flex items-center">
                <span className="text-gray-300">Deliver to</span>
                <span className="ml-1 font-medium">Seattle, WA 98101</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select className="bg-amazon-dark text-white text-sm border-none">
                <option>EN</option>
              </select>
              <div className="flex items-center space-x-2">
                <span>Hello, Customer</span>
                <span className="text-gray-300">Account & Lists</span>
              </div>
              <span className="text-gray-300">Returns & Orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-amazon-dark">TechVault</span>
            </Link>

            {/* Search bar */}
            <div className="flex-1 max-w-2xl">
              <div className="flex">
                <select className="bg-gray-100 border border-gray-300 rounded-l-md px-3 py-2 text-sm">
                  <option>All</option>
                  <option>Electronics</option>
                  <option>Computers</option>
                  <option>Accessories</option>
                </select>
                <input
                  type="text"
                  placeholder="Search TechVault"
                  className="flex-1 border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-r-md">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-xs text-gray-500">Hello, Customer</div>
                <div className="text-sm font-medium">Account & Lists</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Returns</div>
                <div className="text-sm font-medium">& Orders</div>
              </div>
              <button
                onClick={onCartClick}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary navigation */}
      <div className="bg-amazon-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6 py-2">
            <button className="flex items-center space-x-1 hover:bg-amazon-dark px-2 py-1 rounded">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>All</span>
            </button>
            <Link href="#" className="hover:bg-amazon-dark px-2 py-1 rounded">Today&apos;s Deals</Link>
            <Link href="#" className="hover:bg-amazon-dark px-2 py-1 rounded">Customer Service</Link>
            <Link href="#" className="hover:bg-amazon-dark px-2 py-1 rounded">Registry</Link>
            <Link href="#" className="hover:bg-amazon-dark px-2 py-1 rounded">Gift Cards</Link>
            <Link href="#" className="hover:bg-amazon-dark px-2 py-1 rounded">Sell</Link>
          </div>
        </div>
      </div>
    </>
  );
}
