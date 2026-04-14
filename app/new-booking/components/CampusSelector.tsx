// new-booking/components/CampusSelector.tsx
"use client";

import React, { Dispatch, SetStateAction } from "react";

// components
import { LoadingOverlay } from "@/components/Loading/LoadingOverlay";
import Container from "@/components/Container";
import BookingTypeSelect from "@/components/Room_Info/BookingTypeSelect";

// hooks
import useCampus from "@/hooks/useCampus";
import { useScrollTop } from "@/hooks/useScrollTop";
// import { StatusPopup } from "@/app/loading/components/StatusPopup";

interface CampusSelectorProps {
  setStep: Dispatch<SetStateAction<number>>;
}

export function CampusSelector({ setStep }: CampusSelectorProps) {
  const {
    errors, setErrors, ownerStudentId, setOwnerId, isLoading, noteError,
    handleTypeChange, handleVerifyOwner, handleSelectRegion,
    handleLifestyle, handleNoteChange } = useCampus(setStep);

  useScrollTop();

  return (
    <Container
      title="Room Information / ข้อมูลห้องพัก"
    >
      {isLoading && <LoadingOverlay message="Currently checking...." />}

      <BookingTypeSelect
        errors={errors}
        setErrors={setErrors}
        ownerStudentId={ownerStudentId}
        setOwnerId={setOwnerId}
        noteError={noteError}

        handleTypeChange={handleTypeChange}
        handleVerifyOwner={handleVerifyOwner}
        handleSelectRegion={handleSelectRegion}
        handleLifestyle={handleLifestyle}
        handleNoteChange={handleNoteChange}
        setStep={setStep}
      />
    </Container >
  );
}