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
} from "lucide-react";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export default function SecurityForm() {
  // ✅ Correct calendar range type
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  return (
    <section className="">
      <form className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FULL NAME */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Full Name *</label>
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

          {/* PHONE NUMBER */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Phone Number *</label>
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

          {/* EMAIL */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email (Optional)</label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <Mail className="text-[#244672] w-5 h-5" />
              <input
                type="email"
                className="w-full bg-transparent focus:outline-none"
                placeholder="example@gmail.com"
              />
            </div>
          </div>

          {/* LOCATION */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Property Location *</label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <MapPin className="text-[#244672] w-5 h-5" />
              <input
                type="text"
                className="w-full bg-transparent focus:outline-none"
                placeholder="e.g. Karen, Runda, Kitengela, Thika..."
                required
              />
            </div>
          </div>

          {/* ID NUMBER */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">ID Number *</label>
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

          {/* DATE RANGE PICKER */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Security Service Duration *
            </label>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full border rounded-lg p-3 gap-3 bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="text-[#244672] w-5 h-5" />
                    <span className="text-gray-600">
                      {dateRange?.from && dateRange?.to
                        ? `${format(dateRange.from, "PPP")} → ${format(
                            dateRange.to,
                            "PPP"
                          )}`
                        : "Select date range"}
                    </span>
                  </div>
                </button>
              </PopoverTrigger>

              <PopoverContent className="p-0 bg-white shadow-lg rounded-xl">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* DOGS NEEDED */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Number of Guard Dogs Needed
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <Dog className="text-[#244672] w-5 h-5" />
              <select className="w-full bg-transparent focus:outline-none">
                <option>1 Guard Dog + Handler</option>
                <option>2 Guard Dogs + Handlers</option>
                <option>3+ (Large compound/estate)</option>
              </select>
            </div>
          </div>

          {/* REASON */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Reason for Temporary Security
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <AlertTriangle className="text-[#244672] w-5 h-5" />
              <select className="w-full bg-transparent focus:outline-none">
                <option>Family travel / vacation</option>
                <option>Night shift work</option>
                <option>House help exited</option>
                <option>Construction / renovation period</option>
                <option>High-risk period</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* NOTES */}
        <div className="mt-6">
          <label className="block text-gray-700 font-medium mb-2">
            Additional Notes / Special Instructions
          </label>
          <div className="flex items-start border rounded-lg p-3 gap-3 bg-gray-50">
            <FileText className="text-[#244672] w-5 h-5 mt-1" />
            <textarea
              className="w-full bg-transparent h-32 focus:outline-none"
              placeholder="Property size, entry points, alarm details, special requests..."
            ></textarea>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          className="w-full bg-[#b38f62] text-white py-4 text-lg font-semibold hover:bg-[#b38f62] transition"
        >
          Deploy Security Team Now
        </button>

        <p className="text-center text-sm text-gray-500 mt-2">
          You will receive a call within 15 minutes to confirm deployment ✔
        </p>
      </form>
    </section>
  );
}
