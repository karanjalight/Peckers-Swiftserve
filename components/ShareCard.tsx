'use client';

import React from 'react';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaLink } from 'react-icons/fa';

interface ShareCardProps {
  jobId: string;
  title: string;
  location: string;
}

const ShareCard: React.FC<ShareCardProps> = ({ jobId, title, location }) => {
  const jobUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${jobId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${title} - ${location}\n${jobUrl}`);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Share this job
      </h3>

      <div className="grid grid-cols-4 gap-3">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `${title} - ${location}\n${jobUrl}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center p-3 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-xl transition-all hover:scale-105"
        >
          <FaWhatsapp size={18} />
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            jobUrl
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl transition-all hover:scale-105"
        >
          <FaFacebookF size={18} />
        </a>

        {/* Instagram (copies + opens Instagram) */}
        <button
          onClick={() => {
            copyToClipboard();
            window.open('https://www.instagram.com', '_blank');
          }}
          className="flex items-center justify-center p-3 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold rounded-xl transition-all hover:scale-105"
        >
          <FaInstagram size={18} />
        </button>

        {/* Copy link */}
        <button
          onClick={copyToClipboard}
          className="flex gap-2 items-center text-xs justify-center p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-all hover:scale-105"
        >
          <FaLink size={18} />
          Copy
        </button>
      </div>
    </div>
  );
};

export default ShareCard;
