"use client";

import { useState } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/contact-us", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus("success");
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          message: "",
        });
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <section className=" w-full bg-white rounded-2xl">
      <h2 className="text-3xl md:text-5xl font-semibold text-gray-800 mb-2">Get in touch.</h2>
      <p className="text-gray-600 mb-6">
        Fill up the form & our team will get back to you within hours
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your Name..."
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300  px-3 py-2 focus:ring-2 focus:ring-green-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Your Email..."
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300  px-3 py-2 focus:ring-2 focus:ring-green-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              placeholder="Your Phone..."
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300  px-3 py-2 focus:ring-2 focus:ring-green-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              name="address"
              placeholder="Your Address..."
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-gray-300  px-3 py-2 focus:ring-2 focus:ring-green-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            name="message"
            rows={4}
            placeholder="Enter Your Message..."
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full border border-gray-300  px-3 py-2 focus:ring-2 focus:ring-green-600 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-green-600 text-white font-medium px-6 py-2  flex items-center justify-center hover:bg-green-700 transition-all duration-200"
        >
          {status === "loading" ? "Sending..." : "Send Message"}
          <span className="ml-2">→</span>
        </button>

        {status === "success" && (
          <p className="text-green-600 text-sm mt-2">Message sent successfully!</p>
        )}
        {status === "error" && (
          <p className="text-red-600 text-sm mt-2">Something went wrong. Try again.</p>
        )}
      </form>
    </section>
  );
}
