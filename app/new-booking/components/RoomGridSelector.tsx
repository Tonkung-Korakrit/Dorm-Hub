// new-booking/components/RoomGridSelection.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useBooking } from "@/app/contexts/BookingContext";

// components
import { RoomGridSkeleton } from "@/components/Loading/book/RoomGridSkeleton";
import Container from "@/components/Container";
import InfoBox from "@/components/Room_Info/InfoBox";
import Floor from "@/components/Room_Info/Floor";
import StatusLegend from "@/components/Room_Info/StatusLegend";
import LayoutRoom from "@/components/Room_Info/LayoutRoom";
import SuiteModal from "@/components/Room_Info/SuiteModal";
import DetailPopup from "@/components/Room_Info/DetailPopup";

// hooks
import { useScrollTop } from "@/hooks/useScrollTop";
import useRooms from "@/hooks/useRooms";

// const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RoomGridSelectorProps {
  setStep: (step: number) => void;
}

export const RoomGridSelector = ({ setStep }: RoomGridSelectorProps) => {
  const { formResident, formRoom, currentBooking } = useBooking();

  const { confirmRoom, setConfirmRoom, selectedFloor, setSelectedFloor,
    checkIsMobile, setCheckIsMobile, isCharterBroken, getRoomColor,
    isRoomFull, cannotBook, planImage, selectedSuite, setSelectedSuite,
    matchScore, popupPos, setPopupPos, isLoading, roomsByFloor,
    calculateMatch, getMatchStatusLabel, handleSelectRoom, canUserBookRoom, handleRoomClick
  } = useRooms(setStep);

  useScrollTop();

  useEffect(() => {
    // ใช้ 640px เป็นตัวแบ่ง (Medium breakpoint)
    const media = window.matchMedia('(max-width: 639px)');

    setCheckIsMobile(media.matches);

    const listener = (e: MediaQueryListEvent) => setCheckIsMobile(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, []);

  // useEffect(() => {
  //   const handleGlobalScroll = () => {
  //     if (confirmRoom) setConfirmRoom(null);
  //   };

  //   // ใช้ true เพื่อดักจับ Event ทุกระดับ (Capture Phase)
  //   window.addEventListener("scroll", handleGlobalScroll, true);
  //   return () => window.removeEventListener("scroll", handleGlobalScroll, true);
  // }, [confirmRoom]);

  const handleBackStep = () => {
    setStep(5)
  }

  // console.log("formRoom: ", formRoom)

  return (
    <Container
      title={`Room Information / ข้อมูลห้องพัก (โซน ${formRoom?.dorm?.name})`}
      handleBackStep={handleBackStep}
    >
      <InfoBox
        gender={formResident.gender}
        bookingType={currentBooking.type}
        campus={formRoom.campus}
        dorm={formRoom.dorm.name}
        lifestyle={formResident.lifestyle}
        lifestyleNote={formResident.lifestyleNote}
      />

      {isLoading ? (
        <RoomGridSkeleton
          maxCols={formRoom?.dorm?.maxCols || 5}
          maxRows={formRoom?.dorm?.maxRows || 5}
        />
      ) : (
        <>
          <Floor roomsByFloor={roomsByFloor} selectedFloor={selectedFloor} setSelectedFloor={setSelectedFloor} />
          <StatusLegend />

          <LayoutRoom
            planImage={planImage} roomsByFloor={roomsByFloor}
            selectedFloor={selectedFloor} confirmRoom={confirmRoom}
            checkIsMobile={checkIsMobile} canUserBookRoom={canUserBookRoom}
            calculateMatch={calculateMatch} handleRoomClick={handleRoomClick}
            getRoomColor={getRoomColor} getMatchStatusLabel={getMatchStatusLabel} />
        </>
      )}

      {selectedSuite && (
        <SuiteModal
          selectedSuite={selectedSuite} setSelectedSuite={setSelectedSuite}
          canUserBookRoom={canUserBookRoom} calculateMatch={calculateMatch}
          setConfirmRoom={setConfirmRoom} checkIsMobile={checkIsMobile}
          setPopupPos={setPopupPos}
        />
      )}

      {confirmRoom && (
        <DetailPopup
          confirmRoom={confirmRoom} setConfirmRoom={setConfirmRoom}
          popupPos={popupPos} matchScore={matchScore} isRoomFull={isRoomFull}
          isCharterBroken={isCharterBroken} cannotBook={cannotBook}
          handleSelectRoom={handleSelectRoom} calculateMatch={calculateMatch}
        />
      )}
    </Container>
  );
}