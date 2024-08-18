import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function PaymentComponent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const verifyOtp = async () => {
    try {
      const response = await axios.post('https://api.testbuddy.live/v1/auth/verifyotp', {
        mobile: '+919098989999',
        otp: '8899'
      });
      return response.data.token;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Error verifying OTP');
    }
  };

  const getRazorpayKey = async (token) => {
    try {
      const response = await axios.post(
        'https://api.testbuddy.live/v1/payment/key',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.key;
    } catch (error) {
      console.error('Error getting Razorpay key:', error);
      toast.error('Error getting Razorpay key');
    }
  };

  const createOrder = async (token) => {
    try {
      const orderResponse = await axios.post(
        'https://api.testbuddy.live/v1/order/create',
        {
          packageId: '6613d6fbbf1afca9aa1b519e',
          pricingId: '662caa2d50bf43b5cef75232',
          finalAmount: '441',
          couponCode: 'NEET25'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return orderResponse.data;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Error creating order');
    }
  };

  const displayRazorpay = async () => {
    setIsLoading(true);

    const token = await verifyOtp();
    if (!token) {
      toast.error('Failed to verify OTP and retrieve token.');
      setIsLoading(false);
      return;
    }

    const razorpayKey = await getRazorpayKey(token);
    const orderData = await createOrder(token);
    if (!razorpayKey || !orderData) {
      toast.error('Failed to initialize payment.');
      setIsLoading(false);
      return;
    }

    const { amount, _id: transactionId, razorpayOrderId } = orderData;

    const options = {
      key: razorpayKey,
      amount: amount.toString(),
      currency: 'INR',
      name: 'TestBuddy',
      description: 'Test Transaction',
      order_id: razorpayOrderId,
      handler: async (response) => {
        const verificationData = {
          transactionId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        };

        try {
          const verificationResponse = await axios.post(
            'https://api.testbuddy.live/v1/order/verify',
            verificationData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success(verificationResponse.data.msg);
        } catch (error) {
          console.error('Error verifying payment:', error.response ? error.response.data : error);
          toast.error('Payment verification failed.');
        }
      },
      prefill: {
        name,
        email,
        contact: '9999999999'
      },
      theme: { color: '#3399cc' }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
    setIsLoading(false);
  };

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!name || !email) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
      toast.error('Failed to load Razorpay SDK');
      return;
    }
    displayRazorpay();
  };

  return (
<div className="flex items-center justify-center min-h-screen bg-gray-50">
  <ToastContainer />
  <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
    <h2 className="text-3xl font-semibold mb-8 text-center text-gray-800">
      Complete Your Payment
    </h2>
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
        Full Name
      </label>
      <input
        id="name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
        placeholder="Enter your full name"
      />
    </div>
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
        Email Address
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
        placeholder="Enter your email address"
      />
    </div>
    <div className="mb-8">
      <label className="inline-flex items-center">
        <input
          type="checkbox"
          checked={isGift}
          onChange={(e) => setIsGift(e.target.checked)}
          className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
        />
        <span className="ml-3 text-sm text-gray-600">This is a gift</span>
      </label>
    </div>
    <button
      onClick={handlePayment}
      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition duration-200"
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 017-7.93V4a8 8 0 100 16v-1.07A8 8 0 014 12z"></path>
          </svg>
          Processing...
        </div>
      ) : (
        'Pay Now'
      )}
    </button>
  </div>
</div>

  );
}

export default PaymentComponent;




