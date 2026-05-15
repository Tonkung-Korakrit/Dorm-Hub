// new-booking/components/DormSelector.tsx
"use client";

// contexts
import { useBooking } from "@/app/contexts/BookingContext";

// componentss
import InfoBox from "@/components/Room_Info/InfoBox";
import Container from "@/components/Container";
import DormComponent from "@/components/Room_Info/DormComponent";
import { DormSkeleton } from "@/components/Loading/book/DormSkeleton";

// hooks
import useDorms from "@/hooks/useDorms";
import { useScrollTop } from "@/hooks/useScrollTop";

interface DormSelectorProps {
  setStep: (step: number) => void;
}

export function DormSelector({ setStep }: DormSelectorProps) {
  const {
    filteredDorms, dormImages, error, isLoading, handleSelectDorm
  } = useDorms(setStep);

  const { formResident, formRoom, currentBooking } = useBooking();

  useScrollTop();

  if (isLoading) return <DormSkeleton />;
  if (error) return <div>เกิดข้อผิดพลาดในการโหลดข้อมูล</div>;

  const handleBackStep = () => {
    setStep(4)
  }

  return (
    <Container
      title={`Select Dorm / เลือกหอพัก ของวิทยาเขต (${formRoom.campus})`}
      handleBackStep={handleBackStep}
    >
      <InfoBox
        gender={formResident.gender}
        bookingType={currentBooking?.type}
        campus={formRoom.campus}
        lifestyle={formResident.lifestyle}
        lifestyleNote={formResident.lifestyleNote}
      />
      <DormComponent dorms={filteredDorms} onSelect={handleSelectDorm} images={dormImages} isLoading={isLoading} />
    </Container >
  );
}