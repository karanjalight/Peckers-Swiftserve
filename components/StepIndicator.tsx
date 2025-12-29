"use client";

import React from "react";
import { CheckCircle, FileText, UserCheck, CreditCard, CheckCircle2 } from "lucide-react";

export type StepStatus = "completed" | "current" | "upcoming";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
  showDescriptions?: boolean;
}

export default function StepIndicator({
  currentStep,
  steps,
  showDescriptions = true,
}: StepIndicatorProps) {
  const getStepStatus = (index: number): StepStatus => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "current";
    return "upcoming";
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 lg:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 lg:mb-6">
        Booking Progress
      </h3>
      <div className="relative">
        {/* Horizontal Progress line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200 hidden lg:block">
          <div
            className="absolute top-0 left-0 h-full bg-[#b38f62] transition-all duration-500 ease-in-out"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps in Grid/Flex Layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-2 relative">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step Icon */}
                <div
                  className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 mb-2 ${
                    status === "completed"
                      ? "bg-[#b38f62] border-[#b38f62] text-white"
                      : status === "current"
                      ? "bg-white border-[#b38f62] text-[#b38f62] ring-4 ring-[#b38f62]/20"
                      : "bg-white border-slate-300 text-slate-400"
                  }`}
                >
                  {status === "completed" ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 w-full">
                  <div
                    className={`font-semibold text-sm lg:text-base mb-1 ${
                      status === "completed"
                        ? "text-[#b38f62]"
                        : status === "current"
                        ? "text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </div>
                  {showDescriptions && (
                    <p
                      className={`text-xs lg:text-sm leading-tight lg:whitespace-nowrap ${
                        status === "current"
                          ? "text-slate-700"
                          : "text-slate-500"
                      }`}
                    >
                      {step.description}
                    </p>
                  )}
                  {status === "current" && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs text-[#b38f62] font-medium">
                      <div className="w-2 h-2 bg-[#b38f62] rounded-full animate-pulse" />
                      <span className="hidden lg:inline">In Progress</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Predefined steps for nanny booking flow
export const NANNY_BOOKING_STEPS: Step[] = [
  {
    id: "request",
    label: "Request Submitted",
    description: "Request received and under review",
    icon: FileText,
  },
  {
    id: "selection",
    label: "Nanny Selection",
    description: "Choose your preferred nanny",
    icon: UserCheck,
  },
  {
    id: "payment",
    label: "Payment",
    description: "Complete payment to confirm",
    icon: CreditCard,
  },
  {
    id: "confirmed",
    label: "Booking Confirmed",
    description: "Booking confirmed successfully",
    icon: CheckCircle2,
  },
];

// Predefined steps for security booking flow (no nanny selection)
export const SECURITY_BOOKING_STEPS: Step[] = [
  {
    id: "request",
    label: "Request Submitted",
    description: "Request received and under review",
    icon: FileText,
  },
  {
    id: "payment",
    label: "Payment",
    description: "Complete payment to confirm",
    icon: CreditCard,
  },
  {
    id: "confirmed",
    label: "Booking Confirmed",
    description: "Booking confirmed successfully",
    icon: CheckCircle2,
  },
];

