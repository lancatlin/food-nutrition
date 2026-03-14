import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

import React from "react";
import "./app.css";

// const ReceiptUpload: React.FC = () => {
//   return (
//     <div className="screen">
//       <div className="app-container">
//         <main className="content">
//           <h1 className="title">Upload a Receipt</h1>

//           <div className="upload-box">
//             <div className="upload-icon">
//               <svg
//                 width="22"
//                 height="22"
//                 viewBox="0 0 24 24"
//                 fill="none"
//               >
//                 <path
//                   d="M8 3H16C16.5523 3 17 3.44772 17 4V20L14.5 18.2L12 20L9.5 18.2L7 20V4C7 3.44772 7.44772 3 8 3Z"
//                   stroke="#746582"
//                   strokeWidth="1.8"
//                   strokeLinejoin="round"
//                 />
//                 <path
//                   d="M10 8L11.4 9.4L14.5 6.5"
//                   stroke="#746582"
//                   strokeWidth="1.8"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             </div>

//             <div className="upload-text">
//               Select a File or Open
//               <br />
//               Camera
//             </div>

//             <div className="upload-actions">
//               <button className="action-btn">Select File</button>
//               <button className="action-btn">Open Camera</button>
//             </div>
//           </div>
//         </main>

//         <nav className="bottom-nav">
//           <button className="nav-btn left-btn">
//             📦
//           </button>
//           <button className="camera-btn" title="ru">
//             <FontAwesomeIcon icon={faCamera} size="2x" />
//           </button>
//           <button className="nav-btn right-btn" title="Upload Receipt">
//              <FontAwesomeIcon icon={faCamera} size="2x" />
//            </button>
//           <FontAwesomeIcon icon={faCamera}/>
//         </nav>
//       </div>
//     </div>
//   );
// };

// export default ReceiptUpload;

import { useState } from "react";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function DatePickerModal() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(7); // August
  const [selected, setSelected] = useState<number | null>(17);
  const [activeNav, setActiveNav] = useState("camera");

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectedDate = selected
    ? new Date(viewYear, viewMonth, selected)
    : null;

  const formatHeader = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen p-4">
      <div className="w-[375px] min-h-[780px] bg-[#f9faf7] rounded-[40px] border border-gray-200 overflow-hidden flex flex-col shadow-xl relative">

        {/* Status Bar */}
        <div className="h-11 flex items-center justify-between px-6 bg-[#f9faf7]">
          <span className="text-sm font-medium text-gray-900">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-end gap-0.5">
              <div className="w-1 bg-gray-800 rounded-sm opacity-30" style={{ height: "4px" }} />
              <div className="w-1 bg-gray-800 rounded-sm opacity-50" style={{ height: "6px" }} />
              <div className="w-1 bg-gray-800 rounded-sm opacity-70" style={{ height: "8px" }} />
              <div className="w-1 bg-gray-800 rounded-sm opacity-90" style={{ height: "10px" }} />
            </div>
            <div className="w-4 h-3 border border-gray-800 rounded-sm relative opacity-80">
              <div className="absolute inset-0.5 w-3 bg-gray-800 rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="px-6 pt-4 pb-2">
          <h1 className="text-[28px] font-bold text-gray-900">Add New Food Items</h1>
        </div>

        {/* Background list item (blurred behind modal) */}
        <div className="px-4 opacity-60">
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-[#d4e8d8] flex items-center justify-center text-[#2e6644] text-sm font-semibold">A</div>
            <span className="flex-1 text-gray-800 text-sm font-medium">Chicken Breast</span>
            <span className="text-[#2e6644] text-sm">18 Mar</span>
            <div className="w-5 h-5 border-2 border-[#2e6644] rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-[#2e6644] rounded-sm" />
            </div>
          </div>
        </div>

        {/* Modal Overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center px-4 z-10">
          <div className="w-full bg-[#e8f0e8] rounded-[24px] overflow-hidden shadow-2xl">

            {/* Modal Header */}
            <div className="px-5 pt-5 pb-3">
              <p className="text-xs text-[#4a7c5a] font-medium mb-2">Select date</p>
              <div className="flex items-center justify-between">
                <span className="text-[26px] font-bold text-[#1a3d28]">
                  {selectedDate ? formatHeader(selectedDate) : "No date"}
                </span>
                <button className="text-[#4a7c5a]" title="click">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#4a7c5a" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="h-px bg-[#b8d4b8] mx-5" />

            {/* Month Navigation */}
            <div className="flex items-center justify-between px-5 py-3">
              <button className="flex items-center gap-1 text-[#1a3d28] font-medium text-sm">
                {MONTH_NAMES[viewMonth]} {viewYear}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M7 10l5 5 5-5" stroke="#1a3d28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#c8dcc8]" title="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="#1a3d28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#c8dcc8]" title="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="#1a3d28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 px-4 pb-1">
              {DAYS.map((d, i) => (
                <div key={i} className="text-center text-xs font-medium text-[#4a7c5a] py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 px-4 pb-3">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const isSelected = day === selected;
                const isTod = isToday(day);
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(day)}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-full mx-auto w-9 h-9 transition-colors
                      ${isSelected ? "bg-[#2e6644] text-white font-semibold" : ""}
                      ${isTod && !isSelected ? "border border-[#2e6644] text-[#2e6644] font-medium" : ""}
                      ${!isSelected && !isTod ? "text-[#1a3d28] hover:bg-[#c8dcc8]" : ""}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#b8d4b8]">
              <button
                onClick={() => setSelected(null)}
                className="text-[#2e6644] text-sm font-medium"
              >
                Clear
              </button>
              <div className="flex gap-6">
                <button className="text-[#2e6644] text-sm font-medium">Cancel</button>
                <button className="text-[#2e6644] text-sm font-semibold">OK</button>
              </div>
            </div>
          </div>
        </div>

        {/* Background list item below modal */}
        <div className="px-4 mt-auto mb-4 opacity-60 relative z-0">
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-[#d4e8d8] flex items-center justify-center text-[#2e6644] text-sm font-semibold">A</div>
            <span className="flex-1 text-gray-800 text-sm font-medium">Dishwashing liquid</span>
            <div className="w-5 h-5 border-2 border-gray-300 rounded" />
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="h-20 bg-[#d4e8d8] border-t border-[#b0ccb8] flex items-center justify-around px-4 pb-3 mt-auto">
          <button onClick={() => setActiveNav("gallery")} className={`p-2 rounded-xl transition-colors ${activeNav === "gallery" ? "bg-[#b0ccb8]" : ""}`}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="8" width="11" height="14" rx="2" fill="#1a3d28" />
              <rect x="8" y="2" width="11" height="14" rx="2" fill="#1a3d28" opacity="0.5" />
            </svg>
          </button>

          <button onClick={() => setActiveNav("camera")} className={`w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all ${activeNav === "camera" ? "bg-white border-[2.5px] border-[#2e6644]" : "bg-[#b0ccb8] border-[2.5px] border-transparent"}`}>
            <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
              <rect x="1" y="5" width="24" height="16" rx="3" fill="#1a3d28" />
              <circle cx="13" cy="13" r="5" fill="white" />
              <circle cx="13" cy="13" r="3" fill="#1a3d28" />
              <path d="M9 5L10.5 2H15.5L17 5" stroke="#1a3d28" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <button onClick={() => setActiveNav("list")} className={`p-2 rounded-xl transition-colors ${activeNav === "list" ? "bg-[#b0ccb8]" : ""}`}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="4" width="24" height="20" rx="2" fill="#1a3d28" />
              <line x1="7" y1="10" x2="21" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="7" y1="14" x2="21" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="7" y1="18" x2="16" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Home Indicator */}
        <div className="h-5 bg-[#d4e8d8] flex items-center justify-center">
          <div className="w-[120px] h-1 bg-[#4a7c5a] rounded-full opacity-50" />
        </div>

      </div>
    </div>
  );
}

