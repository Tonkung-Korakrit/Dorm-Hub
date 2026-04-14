import React, { ChangeEvent } from 'react'

interface AgreementsProps {
  isAcceptAgreement: boolean
  handleCheckbox: (e: ChangeEvent<HTMLInputElement>) => void
}

const Agreements = (props: AgreementsProps) => {
  const { isAcceptAgreement, handleCheckbox } = props;
  return (
    <div className="mt-2">
      <label
        htmlFor="agreement"
        className={`flex items-start gap-4 pt-2 pr-2 pl-2 pb-5 transition-all duration-200 cursor-pointer group`}
      >
        <div className="relative flex items-center mt-1">
          <input
            type="checkbox"
            id="agreement"
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-white checked:bg-[#006633] checked:border-[#006633] transition-all focus:ring-2 focus:ring-[#006633]/20"
            checked={isAcceptAgreement}
            onChange={handleCheckbox}
          />
          {/* Checkmark Icon (แสดงเมื่อติ๊ก) */}
          <svg
            className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <span className="text-[12px] md:text-[14px] text-gray-600 leading-relaxed select-none">
          ข้าพเจ้าได้ทำความเข้าใจ และ{" "}
          <a
            href="https://precheckin.psm.tu.ac.th/dormitory-policy"
            target="_blank"
            className="text-[#006633] font-bold underline decoration-[#006633]/30 underline-offset-4 hover:text-[#004d26] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            ยอมรับข้อตกลงการพักอาศัยหอพักนักศึกษามหาวิทยาลัยธรรมศาสตร์
          </a>
          {" "}และ{" "}
          <a
            href="https://precheckin.psm.tu.ac.th/privacy-policy"
            target="_blank"
            className="text-[#006633] font-bold underline decoration-[#006633]/30 underline-offset-4 hover:text-[#004d26] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            ข้อตกลงการใช้ข้อมูล
          </a>
        </span>
      </label>
    </div>
  )
}

export default Agreements
