"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function TermsModal() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check localStorage
    const accepted = typeof window !== "undefined"
      ? localStorage.getItem("termsAccepted")
      : null;

    if (!accepted) {
      // Show modal after 4 seconds
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("termsAccepted", "true");
    setShowModal(false);
  };

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-[#b38f62]/90 max-w-lg w-[90%] rounded-2xl shadow-2xl p-8 relative text-gray-800"
          >
            <h2 className="text-2xl font-bold mb-4 text-white">
              Terms & Conditions
            </h2>

            <p className="text-sm leading-relaxed text-white  mb-6">
              Before accessing the Peckers Swiftserve platform, please read and accept
              our Terms & Conditions. By continuing, you agree to our usage policy,
              privacy standards, and service compliance.
            </p>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                className="border-gray-300 py-6 w-40 text-gray-700 hover:bg-gray-100"
                onClick={handleAccept}
              >
                Cancel
              </Button>

              <Button
                className="bg-[#02273f] w-40 py-6 hover:bg-[#0d141a] text-white px-6"
                onClick={handleAccept}
              >
                Accept & Continue
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
