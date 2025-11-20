"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });

  const [status, setStatus] = useState("idle");

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/contact-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <section className="px-6 md:px-16 lg:px-28 py-20 bg-white">
      <div className="max-w-8xl mx-auto flex lg:flex-row  flex-col gap-6">

        {/* LEFT SIDE: CONTACT DETAILS */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-10 lg:w-1/3"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Let's talk.
          </h2>

          <p className="text-gray-600 text-lg leading-relaxed">
            We’re here to help with anything — partnerships, business, support.
            Reach out and our team will respond within 24 hours.
          </p>

          {/* CONTACT INFO */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <MapPin className="w-7 h-7 text-[#b38f62]" />
              <div>
                <h4 className="font-semibold text-gray-800">Location</h4>
                <p className="text-gray-600">Nairobi, Kenya</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="w-7 h-7 text-[#b38f62]" />
              <div>
                <h4 className="font-semibold text-gray-800">Phone</h4>
                <p className="text-gray-600">+254 712 345 678</p>
                <p className="text-gray-600">+254 798 234 556</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail className="w-7 h-7 text-[#b38f62]" />
              <div>
                <h4 className="font-semibold text-gray-800">Email</h4>
                <p className="text-gray-600">support@peckersswiftserve.co.ke</p>
                <p className="text-gray-600">info@peckersswiftserve.co.ke</p>
              </div>
            </div>
          </div>

          {/* SOCIALS */}
          <div className="flex gap-6 pt-4">
            {[
              { Icon: Facebook, href: "#" },
              { Icon: Instagram, href: "#" },
              { Icon: Twitter, href: "#" },
              { Icon: Linkedin, href: "#" },
            ].map(({ Icon, href }, i) => (
              <motion.a
                key={i}
                href={href}
                whileHover={{ scale: 1.15 }}
                className="p-3 bg-white shadow-md rounded-full border border-gray-200 hover:bg-[#b38f62] hover:text-white transition"
              >
                <Icon className="w-5 h-5" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* RIGHT SIDE: FORM */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white   lg:w-2/3 border border-gray-100 p-8 md:p-12 "
        >
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* GRID INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField label="Name" name="name" value={formData.name} onChange={handleChange} required />
              <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} required={undefined} />
              <InputField label="Address" name="address" value={formData.address} onChange={handleChange} required={undefined} />
            </div>

            {/* MESSAGE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                name="message"
                rows={4}
                required
                placeholder="Enter your message..."
                value={formData.message}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-3 rounded-md 
                focus:ring-2 focus:ring-[#b38f62] transition outline-none"
              />
            </div>

            {/* BUTTON */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={status === "loading"}
              type="submit"
              className="w-full bg-[#b38f62] text-white font-medium px-8 py-3  hover:bg-purple-700 transition disabled:opacity-70"
            >
              {status === "loading" ? "Sending..." : "Send Message"}
            </motion.button>

            {/* STATUS */}
            {status === "success" && (
              <p className="text-[#b38f62] text-sm pt-2">
                ✅ Message sent successfully!
              </p>
            )}
            {status === "error" && (
              <p className="text-red-600 text-sm pt-2">
                ❌ Something went wrong. Try again.
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}
function InputField({
	label,
	name,
	value,
	onChange,
	type = "text",
	required = false,   // ← FIXED
  }) {
	return (
	  <div>
		<label className="block text-sm font-medium text-gray-700 mb-1">
		  {label}
		</label>
		<input
		  type={type}
		  name={name}
		  required={required}
		  placeholder={label + "..."}
		  value={value}
		  onChange={onChange}
		  className="w-full border border-gray-300 px-4 py-3 rounded-md 
		  focus:ring-2 focus:ring-[#b38f62] transition outline-none"
		/>
	  </div>
	);
  }
  