"use client";
import React, { useState } from "react";

const Partners = () => {
  return (
    <div className="lg:my-10">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center">
          <div className="text-sm bg-amber-200 w-60 p-2 px-2 mb-4">
          OUR AWESOME CLIENTS
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#244672] mb-4">
           Our Trusted Publishers & Partners
        </h2>
        <p className="text-gray-600 text-sm max-w-2xl mx-auto">
          We work with leading publishers and brands to bring you the best books and stationery products.
        </p>
      </div>
      <div className="flex items-center lg:px-20 py-10 ">
        <div className="w-full lg:px-20">
          <img src="/partners.png" className="w-screen" alt="Books Buddies Partners" />
        </div>
      </div>
    </div>
  );
};

export default Partners;
