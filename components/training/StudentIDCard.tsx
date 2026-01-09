"use client";

import { useRef, useState } from "react";
import { format, addMonths, parseISO } from "date-fns";
import { Download, X, Loader2 } from "lucide-react";

interface StudentIDCardProps {
  studentName: string;
  studentId: string;
  course: string;
  cohort: string;
  validTill: string;
  onClose?: () => void;
}

export default function StudentIDCard({
  studentName,
  studentId,
  course,
  cohort,
  validTill,
  onClose,
}: StudentIDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) {
      alert("ID card element not found. Please try again.");
      return;
    }

    setDownloading(true);
    let isolatedContainer: HTMLDivElement | null = null;
    
    try {
      // Create an isolated container to avoid CSS color function issues
      isolatedContainer = document.createElement('div');
      isolatedContainer.style.position = 'fixed';
      isolatedContainer.style.left = '-9999px';
      isolatedContainer.style.top = '0';
      isolatedContainer.style.width = cardRef.current.offsetWidth + 'px';
      isolatedContainer.style.height = cardRef.current.offsetHeight + 'px';
      isolatedContainer.style.backgroundColor = '#ffffff';
      isolatedContainer.style.zIndex = '-1';
      isolatedContainer.style.isolation = 'isolate';
      document.body.appendChild(isolatedContainer);

      // Clone the card and append to isolated container
      const clonedCard = cardRef.current.cloneNode(true) as HTMLElement;
      clonedCard.style.position = 'relative';
      clonedCard.style.margin = '0';
      clonedCard.style.isolation = 'isolate';
      isolatedContainer.appendChild(clonedCard);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 200));

      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;
      
      const canvas = await html2canvas(isolatedContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        width: isolatedContainer.offsetWidth,
        height: isolatedContainer.offsetHeight,
        windowWidth: isolatedContainer.offsetWidth,
        windowHeight: isolatedContainer.offsetHeight,
        onclone: (clonedDoc) => {
          // Remove any problematic styles from the cloned document
          const styleSheets = clonedDoc.styleSheets;
          for (let i = 0; i < styleSheets.length; i++) {
            try {
              const sheet = styleSheets[i];
              if (sheet.cssRules) {
                for (let j = sheet.cssRules.length - 1; j >= 0; j--) {
                  const rule = sheet.cssRules[j];
                  if (rule.cssText && (rule.cssText.includes('lab(') || rule.cssText.includes('oklch('))) {
                    try {
                      sheet.deleteRule(j);
                    } catch (e) {
                      // Ignore deletion errors
                    }
                  }
                }
              }
            } catch (e) {
              // Ignore stylesheet access errors
            }
          }
        },
      });

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        // Clean up
        if (isolatedContainer && isolatedContainer.parentNode) {
          isolatedContainer.parentNode.removeChild(isolatedContainer);
        }
        
        if (!blob) {
          setDownloading(false);
          throw new Error("Failed to create image blob");
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `student-id-${studentId.replace(/\//g, "-")}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setDownloading(false);
      }, "image/png", 1.0);
    } catch (error: any) {
      console.error("Error generating image:", error);
      
      // Clean up on error
      if (isolatedContainer && isolatedContainer.parentNode) {
        isolatedContainer.parentNode.removeChild(isolatedContainer);
      }
      
      setDownloading(false);
      alert(`Failed to download ID card: ${error.message || "Unknown error"}. Please try again.`);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#244672] to-[#1a3554]">
          <div>
            <h2 className="text-2xl font-bold text-white">Student ID Card</h2>
            <p className="text-sm text-white/80 mt-1">Download your official student identification card</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#244672] rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download
                </>
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ID Card Preview */}
        <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-1 overflow-auto">
          <div
            ref={cardRef}
            className="id-card"
            id="student-id-card"
            style={{
              width: "3.375in",
              height: "2.125in",
              background: "linear-gradient(135deg, #244672 0%, #1a3554 100%)",
              borderRadius: "0",
              padding: "20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              color: "white",
              fontFamily: "Arial, sans-serif",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                borderBottom: "2px solid #b38f62",
                paddingBottom: "8px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#b38f62",
                  marginBottom: "4px",
                }}
              >
                Peckers Swiftserve LTD
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: "1.3",
                }}
              >
                Park Place, Parklands, Nairobi
                <br />
                Email: info@peckersswiftserve.com | Cell: 0741767944
              </div>
            </div>

            {/* Card Body */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
              {/* Info Section */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  Name: {studentName}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  Course: {course}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  ID: {studentId}
                </div>
              </div>
            </div>

            {/* Validity */}
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                right: "20px",
                fontSize: "7px",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Valid: {validTill}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-center">
          <p className="text-xs text-gray-500">
            This ID card is valid for one month from the deposit payment date
          </p>
        </div>
      </div>
    </div>
  );
}

