// components/StepRenderer.tsx
import React from 'react'

import { StudentInfoForm } from '@/app/new-booking/components/StudentInfoForm'
import { ProfileStep } from '@/app/new-booking/components/Profile'
import { VehicleStep } from '@/app/new-booking/components/Vehicle'

import { CampusSelector } from '@/app/new-booking/components/CampusSelector'
import { DormSelector } from '@/app/new-booking/components/DormSelector'
import { RoomGridSelector } from '@/app/new-booking/components/RoomGridSelector'
import { SummaryBooking } from '@/app/new-booking/components/SummaryBooking'

// import { PaymentPage } from '@/app/new-booking/components/Payment'

interface StepRendererProps {
  step: number;
  setStep: (s: number) => void;
}

const StepRenderer = ({ step, setStep }: StepRendererProps) => {
  switch (step) {
    case 1: return <StudentInfoForm setStep={setStep} />
    case 2: return <ProfileStep setStep={setStep} />
    case 3: return <VehicleStep setStep={setStep} />
    case 4: return <CampusSelector setStep={setStep} />
    case 5: return <DormSelector setStep={setStep} />
    case 6: return <RoomGridSelector setStep={setStep} />
    case 7: return <SummaryBooking setStep={setStep} />
    // case 8: return <PaymentPage />
    default: return null;
  }
}

export default StepRenderer
