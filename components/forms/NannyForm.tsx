"use client";

import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Dog,
  AlertTriangle,
  FileText,
  Calendar as CalendarIcon,
  ClipboardList,
  Baby,
  Clock,
} from "lucide-react";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export default function NannyForm() {
  // ✅ Correct calendar range type
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  return (
    <section className="">
      <form className="space-y-8">
        {/* Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Full Name *
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <User className="text-[#244672] w-5 h-5" />
              <input
                type="text"
                className="w-full bg-transparent focus:outline-none"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Phone Number *
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <Phone className="text-[#244672] w-5 h-5" />
              <input
                type="tel"
                className="w-full bg-transparent focus:outline-none"
                placeholder="0700 000 000"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email (Optional)
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <Mail className="text-[#244672] w-5 h-5" />
              <input
                type="email"
                className="w-full bg-transparent focus:outline-none"
                placeholder="example@gmail.com"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Your Location *
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <MapPin className="text-[#244672] w-5 h-5" />
              <input
                type="text"
                className="w-full bg-transparent focus:outline-none"
                placeholder="Nairobi – Westlands, Karen..."
                required
              />
            </div>
          </div>

          {/* ID NUMBER */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              ID Number *
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <User className="text-[#244672] w-5 h-5" />
              <input
                type="text"
                className="w-full bg-transparent focus:outline-none"
                placeholder="Enter your ID Number"
                required
              />
            </div>
          </div>

          {/* Children */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Number of people in the House
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <Baby className="text-[#244672] w-5 h-5" />
              <input
                type="text"
                className="w-full bg-transparent focus:outline-none"
                placeholder="e.g. 1 child (2 years)"
                required
              />
            </div>
          </div>

          {/* Service Needed */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Service Needed *
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <ClipboardList className="text-[#244672] w-5 h-5" />

              <select
                className="w-full bg-transparent focus:outline-none"
                required
              >
                <option value="">Select service</option>
                <option>Emergency Nanny (Under 6 Hours)</option>
                <option>Sunday / Day-Bug Nanny</option>
                <option>Short-Term / Daily Nanny</option>
              </select>
            </div>
          </div>

          {/* Hours Needed */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Hours / Duration *
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <Clock className="text-[#244672] w-5 h-5" />
              <input
                type="text"
                className="w-full bg-transparent focus:outline-none"
                placeholder="4 hours, full day, overnight..."
                required
              />
            </div>
          </div>
        </div>

        {/* Notes - Full Width */}
        <div className="mt-6">
          <label className="block text-gray-700 font-medium mb-2">
            Additional Notes
          </label>
          <div className="flex items-start border rounded-lg p-3 gap-3 bg-gray-50">
            <FileText className="text-[#244672] w-5 h-5 mt-1" />
            <textarea
              className="w-full bg-transparent h-32 focus:outline-none"
              placeholder="Share important details: allergies, routines, special needs..."
            ></textarea>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#b38f62] text-white py-4 text-lg font-semibold   hover:bg-[#b38f62] transition "
        >
          Request Emergency Nanny
        </button>

        <p className="text-center text-sm text-gray-500 mt-2">
          You will be contacted immediately after submission ✔
        </p>
      </form>
    </section>
  );
}
