"use client";

import { useEffect } from "react";
import { MdClose } from "react-icons/md";

interface BookingDetailModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

const fields = [
  { label: "Student ID", value: (booking: any) => booking?.cus_users?.studentId },
  { label: "Gender", value: (booking: any) => booking?.cus_users?.gender },
  { label: "Name (TH)", value: (booking: any) => booking?.cus_users?.name_th },
  { label: "Name (EN)", value: (booking: any) => booking?.cus_users?.name_en },
  { label: "Citizen Type", value: (booking: any) => booking?.cus_users?.citizenType },
  { label: "Citizen Number", value: (booking: any) => booking?.cus_users?.citizenNumber },
  { label: "Email", value: (booking: any) => booking?.cus_users?.email },
  { label: "Mobile Phone", value: (booking: any) => booking?.cus_users?.mobilePhone },
  { label: "Faculty / Department", value: (booking: any) => booking?.cus_users?.faculty_department },
  { label: "Booking Type", value: (booking: any) => booking?.type },
  { label: "Room ID", value: (booking: any) => booking?.room?.roomId },
  { label: "Floor", value: (booking: any) => booking?.room?.floor },
];

const vehicleFields = [
  { label: "License Plate", value: (booking: any) => booking?.cus_users?.vehicleInfo?.licensePlate },
  { label: "Province", value: (booking: any) => booking?.cus_users?.vehicleInfo?.province },
  { label: "Owner Name", value: (booking: any) => booking?.cus_users?.vehicleInfo?.ownerName },
];

const getProfileImagePath = (booking: any, type: "FACE_PHOTO" | "CITIZEN_CARD") =>
  booking?.cus_users?.profileImage?.find((image: any) => image.type === type)?.path || "";

const getAddressTypeLabel = (type: string) => {
  if (type === "REGISTERED") return "Registered Address";
  if (type === "CURRENT") return "Current Address";
  return type || "Address";
};

export default function BookingDetailModal({ booking, isOpen, onClose }: BookingDetailModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const vehicleImagePath = booking?.cus_users?.vehicleInfo?.fileImages || "";
  const facePhotoPath = getProfileImagePath(booking, "FACE_PHOTO");
  const citizenCardPath = getProfileImagePath(booking, "CITIZEN_CARD");
  const addresses = booking?.cus_users?.address || [];
  const addressFields = addresses.flatMap((address: any) => {
    const prefix = getAddressTypeLabel(address.type);

    return [
      { label: `${prefix} Detail`, value: address.addressDetail },
      { label: `${prefix} Sub-district`, value: address.subDistrict },
      { label: `${prefix} District`, value: address.district },
      { label: `${prefix} Province`, value: address.province },
      { label: `${prefix} Postal Code`, value: address.postalCode },
      { label: `${prefix} Country`, value: address.country },
    ];
  });
  const hasVehicleInfo = vehicleFields.some((field) => field.value(booking));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
        className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
          <div>
            <h2 id="booking-detail-title" className="text-lg font-bold text-slate-900">
              Booking Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close booking details"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-6 sm:px-8">
          <div className="mb-4">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              User Image 
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[
                { label: "Face Photo", path: facePhotoPath, alt: "Face photo" },
                { label: "Citizen Card", path: citizenCardPath, alt: "Citizen card" },
              ].map((image) => (
                <div key={image.label} className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-slate-50/70">
                  {image.path ? (
                    <a
                      href={image.path}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative block overflow-hidden"
                      title="Open image in new tab"
                    >
                      <img
                        src={image.path}
                        alt={image.alt}
                        className="h-72 w-full cursor-zoom-in object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.2em] text-white/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        Open Full Size
                      </div>
                    </a>
                  ) : (
                    <div className="flex h-72 items-center justify-center px-6 text-center text-sm font-semibold text-slate-400">
                      No image uploaded
                    </div>
                  )}
                  <div className="border-t border-slate-100 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {image.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              Student Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {field.label}
                  </p>
                  <p className="break-words text-sm font-semibold text-slate-800">
                    {String(field.value(booking) ?? "-")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              User Address
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {addressFields.length > 0 ? (
                addressFields.map((field) => (
                  <div key={field.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {field.label}
                    </p>
                    <p className="break-words text-sm font-semibold text-slate-800">
                      {String(field.value ?? "-")}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 sm:col-span-2">
                  <p className="break-words text-sm font-semibold text-slate-800">
                    No address information provided
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              Vehicle Information
            </h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {hasVehicleInfo ? (
                  vehicleFields.map((field) => (
                    <div key={field.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {field.label}
                      </p>
                      <p className="break-words text-sm font-semibold text-slate-800">
                        {String(field.value(booking) ?? "-")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm font-semibold text-slate-400 sm:col-span-2">
                    No vehicle information provided
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-slate-50/70">
                {vehicleImagePath ? (
                  <a
                    href={vehicleImagePath}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block overflow-hidden"
                    title="Open image in new tab"
                  >
                    <img
                      src={vehicleImagePath}
                      alt="Vehicle registration"
                      className="h-64 w-full cursor-zoom-in object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.2em] text-white/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      Open Full Size
                    </div>
                  </a>
                ) : (
                  <div className="flex h-64 items-center justify-center px-6 text-center text-sm font-semibold text-slate-400">
                    No vehicle image uploaded
                  </div>
                )}
                <div className="border-t border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Vehicle Image
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
