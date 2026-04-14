"use client";

import { FACULTY_LIST } from '@/utils/constants';
import { Combobox, Transition } from '@headlessui/react';
import React, { useEffect, useState } from 'react'
import { MdCheck, MdSwapVert } from 'react-icons/md';
import Verify from './Verify';

// interface Faculty {
//   id: string;
//   name: string;
// }

interface FacultyComboboxProps {
  value: string;
  onChange: (value: string) => void;
  // list: Faculty[];
  error?: boolean;
}

const FacultyCombobox = ({ value, onChange, error }: FacultyComboboxProps) => {
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filtered = query === ''
    ? FACULTY_LIST
    : FACULTY_LIST.filter((item) =>
      item.name.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, ''))
    );

  if (!mounted) {
    return <div className="w-full h-[42px] bg-gray-50 border border-gray-300 rounded-lg animate-pulse" />;
  }

  return (
    <div className="col-span-2">
      <label className="block text-[16px] font-medium text-gray-700 mb-1">
        Faculty & Department / คณะ และสาขา <span className="text-red-500">*</span>
      </label>
      <Combobox value={value} onChange={onChange}>
        <div className="relative mt-1">
          <div className={`relative w-full cursor-default overflow-hidden rounded-lg border border-gray-300 bg-white text-left focus-within:ring-2 focus-within:ring-[#006633] transition-all ${error ? "border-red-500 border-2" : ""}`}>
            <Combobox.Input
              className="w-full border-none py-2.5 pl-4 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 outline-none"
              displayValue={(val: string) => val}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหาคณะ..."
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <MdSwapVert className="h-5 w-5 text-gray-400" />
            </Combobox.Button>
          </div>
          <Transition as={React.Fragment} afterLeave={() => setQuery('')}>
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              {filtered.length === 0 ? (
                <div className="py-2 px-4 text-gray-700">ไม่พบข้อมูล</div>
              ) : (
                filtered.map((faculty) => (
                  <Combobox.Option
                    key={faculty.id}
                    className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-[#006633] text-white' : 'text-gray-900'}`}
                    value={faculty.name}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block whitespace-normal leading-tight ${selected ? 'font-bold' : 'font-normal'}`}>{faculty.name}</span>
                        {selected && (
                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-[#006633]'}`}>
                            <MdCheck className="h-5 w-5" />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
      {error && <Verify name={"faculty_department"} />}
    </div>
  );
}

export default FacultyCombobox
