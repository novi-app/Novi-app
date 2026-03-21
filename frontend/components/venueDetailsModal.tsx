"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Venue } from "@/lib/types";

interface VenueDetailsModalProps {
  venue: Venue;
  onClose: () => void;
  onDirections: () => void;
}

const USER_LOCATION = { latitude: 35.6595, longitude: 139.7004 };

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function VenueDetailsModal({ venue, onClose, onDirections }: VenueDetailsModalProps) {
  const onCloseRef = useRef(onClose);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    history.pushState({ modal: true }, "");
    const handler = () => onCloseRef.current();
    window.addEventListener("popstate", handler);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("popstate", handler);
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => history.back(), 480);
  };

  const priceSymbol = venue.price_level > 0 ? "¥".repeat(venue.price_level) : "FREE";

  const walkingIcon = (
    <svg width="10" height="13" viewBox="0 0 10 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.47953 0.799491C5.16126 0.799491 4.85605 0.925921 4.631 1.15096C4.40596 1.37601 4.27953 1.68123 4.27953 1.99949C4.27953 2.31775 4.40596 2.62298 4.631 2.84802C4.85605 3.07306 5.16126 3.19949 5.47953 3.19949C5.79782 3.19949 6.10303 3.07306 6.32803 2.84802C6.55313 2.62298 6.67953 2.31775 6.67953 1.99949C6.67953 1.68123 6.55313 1.37601 6.32803 1.15096C6.10303 0.925921 5.79782 0.799491 5.47953 0.799491ZM3.47953 1.99949C3.47962 1.66031 3.56597 1.32672 3.73046 1.03009C3.89495 0.733451 4.13216 0.483531 4.41983 0.303811C4.70749 0.124101 5.03614 0.020491 5.37486 0.00274099C5.71353 -0.015009 6.05123 0.0536711 6.35613 0.202331C6.66103 0.351001 6.92303 0.574751 7.11763 0.852561C7.31223 1.13037 7.43293 1.45311 7.46853 1.79043C7.50403 2.12774 7.45323 2.46856 7.32083 2.78083C7.18843 3.09309 6.97873 3.36655 6.71153 3.57549C7.10703 3.74343 7.44463 4.02349 7.68273 4.38109L8.10273 5.01149L9.29393 5.86189C9.44593 5.96775 9.57543 6.10274 9.67493 6.25902C9.77443 6.4153 9.84193 6.58977 9.87343 6.77231C9.90503 6.95486 9.90003 7.14186 9.85873 7.32246C9.81753 7.50307 9.74083 7.67369 9.63323 7.82445C9.52553 7.9752 9.38903 8.10309 9.23153 8.2007C9.07413 8.29831 8.89883 8.36369 8.71593 8.39307C8.53303 8.42244 8.34613 8.41524 8.16603 8.37184C7.98593 8.32845 7.81623 8.24975 7.66673 8.14029L6.26673 7.14029L6.19473 7.08509L6.18273 7.12029L6.93713 8.26109C7.13713 8.56514 7.25953 8.91314 7.29233 9.27474L7.47393 11.2747C7.50033 11.6405 7.38213 12.002 7.14473 12.2816C6.90723 12.5612 6.56963 12.7364 6.20443 12.7696C5.83913 12.8028 5.47543 12.6914 5.19146 12.4593C4.9075 12.2271 4.72598 11.8928 4.68593 11.5283L4.51793 9.67874L4.12273 9.08114L2.97873 11.9235C2.83754 12.2641 2.56764 12.5353 2.22767 12.6781C1.88771 12.8209 1.50511 12.8239 1.163 12.6863C0.820876 12.5487 0.546866 12.2816 0.400476 11.9432C0.254076 11.6047 0.247126 11.2222 0.381126 10.8787L1.45873 8.20029C1.22514 8.2101 0.992796 8.16125 0.782936 8.0582C0.573066 7.95514 0.392346 7.80117 0.257276 7.61034C0.122206 7.4195 0.0370757 7.19788 0.00965567 6.96569C-0.0177543 6.7335 0.0134158 6.49814 0.100326 6.28109L0.980326 4.08109C1.06269 3.87549 1.19265 3.69237 1.35953 3.54676C1.52642 3.40115 1.72547 3.29722 1.94033 3.24349L3.17233 2.93549C3.34033 2.89282 3.50887 2.87096 3.67793 2.86989C3.54706 2.59841 3.47924 2.30087 3.47953 1.99949ZM3.73393 3.61949L2.13393 4.01949C2.04172 4.04246 1.95628 4.087 1.88465 4.14945C1.81302 4.2119 1.75725 4.29047 1.72193 4.37869L0.841926 6.57869C0.809826 6.65233 0.792836 6.73166 0.791976 6.81199C0.791106 6.89232 0.806386 6.972 0.836886 7.04631C0.867396 7.12063 0.912516 7.18806 0.969566 7.24461C1.02663 7.30116 1.09446 7.34567 1.16904 7.37551C1.24362 7.40536 1.32344 7.41992 1.40375 7.41834C1.48407 7.41676 1.56325 7.39907 1.6366 7.36631C1.70995 7.33355 1.77597 7.2864 1.83076 7.22765C1.88554 7.1689 1.92797 7.09975 1.95553 7.02429L2.64833 5.29389C2.66624 5.24469 2.69387 5.19959 2.72957 5.16128C2.76526 5.12298 2.8083 5.09224 2.85612 5.07091C2.90394 5.04957 2.95556 5.03808 3.00792 5.0371C3.06027 5.03613 3.11228 5.0457 3.16086 5.06524C3.20944 5.08478 3.25359 5.11389 3.29069 5.15084C3.32779 5.18779 3.35707 5.23183 3.3768 5.28033C3.39654 5.32883 3.40631 5.38081 3.40554 5.43317C3.40477 5.48552 3.39348 5.53719 3.37233 5.58509L1.12273 11.1771C1.0909 11.2506 1.0741 11.3297 1.07334 11.4098C1.07257 11.4899 1.08786 11.5693 1.11829 11.6434C1.14872 11.7175 1.19368 11.7848 1.25052 11.8412C1.30736 11.8977 1.37493 11.9422 1.44923 11.9721C1.52354 12.002 1.60309 12.0167 1.68319 12.0154C1.76328 12.0141 1.8423 11.9968 1.91558 11.9644C1.98887 11.9321 2.05493 11.8854 2.10988 11.8271C2.16483 11.7688 2.20756 11.7001 2.23553 11.6251L3.37953 8.78274C3.434 8.64734 3.52445 8.52944 3.64109 8.44184C3.75773 8.35415 3.89612 8.30006 4.04129 8.2854C4.18645 8.27073 4.33287 8.29604 4.46468 8.3586C4.5965 8.42114 4.70869 8.51854 4.78913 8.64034L5.26753 9.36434C5.28561 9.39184 5.29661 9.42344 5.29953 9.45634L5.48113 11.4563C5.49563 11.6147 5.57253 11.761 5.69493 11.8628C5.81723 11.9646 5.97503 12.0136 6.13353 11.9991C6.29203 11.9845 6.43823 11.9076 6.54003 11.7853C6.64183 11.6629 6.69083 11.5051 6.67633 11.3467L6.49473 9.34754C6.47373 9.11714 6.39593 8.89564 6.26833 8.70274L5.52913 7.58269C5.45953 7.47738 5.41593 7.3571 5.40173 7.23168C5.38755 7.10627 5.40323 6.97928 5.44753 6.86109L5.74993 6.05309C5.77183 5.995 5.80933 5.94409 5.85833 5.90594C5.90733 5.86779 5.96593 5.84389 6.02753 5.83686C6.08923 5.82983 6.15173 5.83995 6.20803 5.8661C6.26433 5.89225 6.31233 5.93343 6.34673 5.98509L6.57953 6.33389C6.62003 6.39522 6.67023 6.44696 6.72993 6.48909L8.12993 7.48909C8.19393 7.53709 8.26683 7.57182 8.34433 7.59124C8.42193 7.61066 8.50263 7.61438 8.58163 7.60217C8.66063 7.58997 8.73643 7.56209 8.80453 7.52017C8.87263 7.47826 8.93173 7.42315 8.97823 7.3581C9.02473 7.29304 9.05773 7.21934 9.07533 7.14134C9.09293 7.06333 9.09483 6.9826 9.08073 6.90387C9.06673 6.82515 9.03713 6.75002 8.99363 6.68291C8.95013 6.61581 8.89363 6.55807 8.82753 6.51309L7.63633 5.66189C7.55773 5.60549 7.48993 5.53529 7.43633 5.45469L6.77793 4.46829C6.69513 4.3443 6.56903 4.2556 6.42433 4.21949L4.02433 3.61949C3.92899 3.59571 3.82927 3.59571 3.73393 3.61949Z" fill="#4A5565" />
    </svg>
  );

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col justify-end transition-opacity duration-500 ${visible ? "opacity-100 bg-black/90" : "opacity-0 bg-black/0"}`}
      onClick={handleClose}
    >
      <div
        className={`bg-cream flex flex-col h-[100%] transition-transform duration-500 ease-out ${visible ? "translate-y-0" : "translate-y-full"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto pb-6" style={{ scrollbarWidth: "none" }}>
          <div className="relative w-full h-72 bg-gray-100 mb-4">
            {venue.photo && (
              <Image src={venue.photo} alt={venue.name} fill className="object-cover" unoptimized />
            )}
            <button
              onClick={handleClose}
              className="absolute left-6 w-8 h-8 flex items-center justify-center rounded-full bg-white backdrop-blur-sm"
              style={{ top: "max(env(safe-area-inset-top), 1rem)" }}
            >
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className="px-6">
          <h2 className="text-2xl font-bold text-black mb-2">{venue.name}</h2>

          <div className="flex items-center gap-2 mb-4">
            <span>⭐️</span>
            <span className="font-bold text-gray-700">{venue.rating.toFixed(1)}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">{priceSymbol}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600 text-sm flex items-center gap-1">
        {walkingIcon}
        {Math.max(1, Math.round(haversineKm(USER_LOCATION.latitude, USER_LOCATION.longitude, venue.location.latitude, venue.location.longitude) / 5 * 60))} min walk
      </span>
      <span className="text-gray-400">·</span>
                  <span className="text-gray-700">{venue.category}</span>

            
          </div>

          {venue.tags && venue.tags.length > 0 && (() => {
          const displayTag = venue.tags.find((t) => t !== "Solo Friendly") ?? venue.tags[0];
          return (
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-[#EFF6FF] text-primary text-sm font-medium rounded-full">
                {displayTag}
              </span>
            </div>
          );
        })()}

        {venue.solo_reason && (
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              <span className="font-bold">👤 Solo-friendly because</span> {venue.solo_reason}
            </p>
          )}

          {venue.pro_tip && (
            <div className="bg-secondary text-white rounded-xl p-4 mb-4">
              <span className="font-semibold text-md">💡 Pro tip:</span> {venue.pro_tip}
            </div>
          )}

          
            
          

          <div className="space-y-3 mx-4">
            {venue.opening_hours && (() => {
              const h = venue.opening_hours;
              let hoursText: string | null = null;
              let isOpen: boolean | null = null;
              if (typeof h === "string") {
                hoursText = h;
              } else {
                if (typeof h.openNow === "boolean") isOpen = h.openNow;
                const descriptions = h.weekdayDescriptions ?? h.weekday_text;
                if (Array.isArray(descriptions)) {
                  const idx = (new Date().getDay() + 6) % 7;
                  const entry: string = descriptions[idx] ?? "";
                  hoursText = entry.includes(": ") ? entry.split(": ").slice(1).join(": ") : entry || null;
                }
              }
              if (!hoursText && isOpen === null) return null;
              return (
                <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3">
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">Hours</p>
                      {isOpen !== null && (
                        <span className={`text-xs font-medium ${isOpen ? "text-green-500" : "text-red-400"}`}>
                          · {isOpen ? "Open now" : "Closed"}
                        </span>
                      )}
                    </div>
                    {hoursText && <p className="text-sm font-bold text-gray-900">{hoursText}</p>}
                  </div>
                </div>
              );
            })()}

            <div className="bg-white rounded-xl px-4 py-5 flex items-center gap-3">
              <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-xs text-gray-400">Address</p>
                <p className="text-sm font-bold text-gray-900">{venue.address}</p>
              </div>
            </div>

            {venue.phone && venue.phone !== "Not available" && (
              <div className="bg-white rounded-xl px-4 py-5 flex items-center gap-3">
                <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <a href={`tel:${venue.phone}`} className="text-sm font-bold text-gray-900">{venue.phone}</a>
                </div>
              </div>
            )}

            {venue.website && venue.website !== "Not available" && (
              <div className="bg-white rounded-xl px-4 py-5 flex items-center gap-3">
                <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <div>
                  <p className="text-xs text-gray-400">Website</p>
                  <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-orange-500">
                    {(() => { try { return new URL(venue.website!).hostname.replace(/^www\./, ""); } catch { return "Visit website"; } })()}
                  </a>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 pb-6 pt-4 border-t border-gray-200">
          <button
            onClick={onDirections}
            className="px-18 py-3 bg-primary text-white font-semibold rounded-full active:scale-[0.98] transition-transform"
          >
            Let's go
          </button>
        </div>
      </div>
    </div>
  );
}
