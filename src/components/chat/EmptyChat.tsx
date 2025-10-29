'use client';

import { MessageCircle, Users, ShoppingBag } from 'lucide-react';

export function EmptyChat() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-6">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to Messages
          </h2>
          <p className="text-gray-600">
            Select a conversation to start chatting with buyers and sellers
          </p>
        </div>

        <div className="space-y-4 text-left">
          <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200">
            <Users className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Connect with traders
              </h3>
              <p className="text-sm text-gray-600">
                Chat directly with buyers and sellers to negotiate prices, discuss items, and coordinate trades.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200">
            <ShoppingBag className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Secure transactions
              </h3>
              <p className="text-sm text-gray-600">
                All conversations are linked to specific listings and orders for better transaction tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200">
            <MessageCircle className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Real-time messaging
              </h3>
              <p className="text-sm text-gray-600">
                Get instant notifications and responses to keep your trades moving quickly.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> You can start a conversation by clicking the "Message Seller" button on any listing page.
          </p>
        </div>
      </div>
    </div>
  );
}