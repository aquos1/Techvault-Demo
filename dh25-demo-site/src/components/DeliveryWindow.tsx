'use client';

import { useState } from 'react';

interface DeliveryWindowProps {
  className?: string;
}

export default function DeliveryWindow({ className = '' }: DeliveryWindowProps) {
  const [selectedWindow, setSelectedWindow] = useState<string>('');

  const deliveryWindows = [
    { id: 'today-1', label: 'Today', time: '2:00 PM - 4:00 PM', available: true },
    { id: 'today-2', label: 'Today', time: '4:00 PM - 6:00 PM', available: true },
    { id: 'today-3', label: 'Today', time: '6:00 PM - 8:00 PM', available: false },
    { id: 'tomorrow-1', label: 'Tomorrow', time: '8:00 AM - 10:00 AM', available: true },
    { id: 'tomorrow-2', label: 'Tomorrow', time: '10:00 AM - 12:00 PM', available: true },
    { id: 'tomorrow-3', label: 'Tomorrow', time: '12:00 PM - 2:00 PM', available: true },
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Choose Delivery Window</h3>
      <div className="space-y-2">
        {deliveryWindows.map((window) => (
          <label
            key={window.id}
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
              window.available
                ? selectedWindow === window.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
                : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
            }`}
          >
            <input
              type="radio"
              name="delivery-window"
              value={window.id}
              checked={selectedWindow === window.id}
              onChange={(e) => setSelectedWindow(e.target.value)}
              disabled={!window.available}
              className="mr-3 text-green-600 focus:ring-green-500"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{window.label}</span>
                <span className="text-sm text-gray-500">{window.time}</span>
              </div>
              {!window.available && (
                <span className="text-xs text-red-500">Unavailable</span>
              )}
            </div>
          </label>
        ))}
      </div>
      
      {selectedWindow && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-800">
              Delivery window selected! Your groceries will arrive fresh.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
