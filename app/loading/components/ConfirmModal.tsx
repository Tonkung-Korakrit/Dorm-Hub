import { MdWarning, MdLogout } from "react-icons/md";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  type: "danger" | "warning";
  isLoading: boolean;
  showCancel?: boolean;
}

export default function ConfirmModal({
  isOpen, onClose, onConfirm, title, message, confirmText, type, isLoading, showCancel = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const titleParts = title.split(" / ");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop: ใช้สีดำจางๆ และ Blur เล็กน้อย */}
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px] animate-in fade-in duration-500" onClick={showCancel ? onClose : undefined} />

      {/* Modal Card: มนและเรียบง่าย */}
      <div className="relative bg-white w-full max-w-[340px] rounded-[2.5rem] shadow-sm border border-gray-100/50 animate-in zoom-in-95 duration-300">
        <div className="p-10 text-center">
          {/* Icon: ขนาดเล็กลง ดูมินิมอล */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 ${type === "danger" ? "bg-red-50 text-red-400" : "bg-amber-50 text-amber-400"
            }`}>
            {type === "danger" ? <MdLogout size={24} /> : <MdWarning size={24} />}
          </div>

          {/* Title: เน้นความสะอาด */}
          <div className="space-y-1 mb-6">
            <h3 className="text-base font-bold text-gray-800 tracking-tight">
              {titleParts[0]}
            </h3>
            {titleParts[1] && (
              <p className="text-[13px] font-medium text-gray-400">
                {titleParts[1]}
              </p>
            )}
          </div>

          {/* Message: ตัวหนังสือโปร่งสบายตา */}
          <div className="space-y-4">
            <p className="text-[12px] leading-[1.8] text-gray-500 whitespace-pre-line px-2">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons: สไตล์ Minimal Pill Buttons */}
        <div className="px-8 pb-8 flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full py-3 rounded-2xl font-bold text-[13px] transition-all active:scale-[0.98] ${type === "danger"
                ? "bg-red-500 text-white shadow-lg shadow-red-200"
                : "bg-gray-900 text-white shadow-lg shadow-gray-200"
              } disabled:opacity-50`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>

          {showCancel && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-[12px] text-gray-400 hover:text-gray-600 transition-colors active:scale-[0.98]"
            >
              Not now / ไว้วันหลัง
            </button>
          )}
        </div>
      </div>
    </div>
  );
}