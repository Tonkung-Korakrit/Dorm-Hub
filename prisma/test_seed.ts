// import { PrismaClient, Role, GenderType, RoomStatus, RoomType, BookingStatus, BookingType, AddressType, DocType } from '@prisma/client'
// import bcrypt from 'bcryptjs'

// const prisma = new PrismaClient()

// async function main() {
//   const hashedPassword = await bcrypt.hash('password123', 10)

//   // --- 1. สร้าง Admin ---
//   const admin = await prisma.admin.upsert({
//     where: { email: 'admin@dorm.com' },
//     update: {},
//     create: {
//       email: 'admin@dorm.com',
//       password: hashedPassword,
//       name: 'Super Admin',
//       employeeId: 'ADM-001',
//       role: Role.ADMIN,
//       isActive: true,
//     },
//   })

//   // --- 2. สร้าง User (นักศึกษา) ---
// //   const student = await prisma.user.upsert({
// //     where: { email: 'student@example.com' },
// //     update: {},
// //     create: {
// //       email: 'student@example.com',
// //       studentId: '6400000001',
// //       citizenType: 'Thai',
// //       citizenNumber: '1234567890123',
// //       gender: GenderType.MALE,
// //       prefix: 'Mr.',
// //       name_en: 'Somsak Learning',
// //       name_th: 'สมศักดิ์ ตั้งใจเรียน',
// //       birthDate: new Date('2003-01-01'),
// //       phone: '0812345678',
// //       role: Role.STUDENT,
// //       lifestyle: ["QUIET", "NON_SMOKER"],
// //       address: {
// //         create: {
// //           type: AddressType.CURRENT,
// //           addressDetail: '123/45 Village A',
// //           subDistrict: 'Klong Luang',
// //           district: 'Klong Luang',
// //           province: 'Pathum Thani',
// //           postalCode: '12120'
// //         }
// //       }
// //     },
// //   })

//   // --- 3. สร้าง หอพัก, โซน และ ห้อง ---
//   const dorm = await prisma.dorm.create({
//     data: {
//       name: 'rangsit',
//       zone: {
//         create: {
//           name: 'M2',
//           gender: GenderType.MALE,
//           mapUrl: 'https://maps.app.goo.gl/HRkjPezdsjEfB5cN9',
//           maxCols: 20,
//           maxRows: 10,
//           rooms: {
//             create: [
//               {
//                 roomId: 'M2-201',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 13,
//                 posY: 7,
//               },
//               {
//                 roomId: 'M2-202',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 12,
//                 posY: 5,
//               },
//               {
//                 roomId: 'M2-203',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 12,
//                 posY: 7,
//               },
//               {
//                 roomId: 'M2-204',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 11,
//                 posY: 5,
//               },
//               {
//                 roomId: 'M2-205',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 11,
//                 posY: 7,
//               },
//               {
//                 roomId: 'M2-206',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 10,
//                 posY: 5,
//               },
//               {
//                 roomId: 'M2-207',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 9,
//                 posY: 7,
//               },
//               {
//                 roomId: 'M2-208',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 9,
//                 posY: 5,
//               },
//               {
//                 roomId: 'M2-209',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 8,
//                 posY: 7,
//               },
//               {
//                 roomId: 'M2-210',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 7,
//                 posY: 5,
//               },
//               {
//                 roomId: 'M2-211',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 7,
//                 posY: 7,
//               },
//               {
//                 roomId: 'M2-212',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 6,
//                 posY: 5,
//               },
//               {
//                 roomId: 'M2-213',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 5,
//                 posY: 7,
//               },
//               {
//                 roomId: 'M2-214',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 5,
//                 posY: 5,
//               },
//               {
//                 roomId: 'M2-215',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 4,
//                 posY: 7,
//               },
//               {
//                 roomId: 'M2-216',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 3,
//                 posY: 7,
//               },
//               {
//                 roomId: 'M2-217',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 0,
//                 posY: 5,
//               },
//               {
//                 roomId: 'M2-218',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 2,
//                 posY: 4,
//               },
//               {
//                 roomId: 'M2-219',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 0,
//                 posY: 4,
//               },
//               {
//                 roomId: 'M2-220',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 2,
//                 posY: 3,
//               },
//               {
//                 roomId: 'M2-221',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 0,
//                 posY: 3,
//               },
//               {
//                 roomId: 'M2-222',
//                 floor: 2,
//                 roomType: RoomType.AC_SHARED_BATHROOM,
//                 price: 1200,
//                 capacity: 4,
//                 status: RoomStatus.AVAILABLE,
//                 posX: 2,
//                 posY: 2,
//               },
//             ]
//           }
//         }
//       }
//     }
//   })

//   // ดึงห้องที่เพิ่งสร้างมาทำ Booking
// //   const room = await prisma.room.findFirst({ where: { roomId: 'B101' } })

// //   if (room) {
// //     // --- 4. สร้างตัวอย่างการจอง (Booking) ---
// //     await prisma.booking.create({
// //       data: {
// //         userId: student.id,
// //         roomId: room.id,
// //         status: BookingStatus.COMPLETED,
// //         type: BookingType.NOT_CHARTER,
// //         verifiedBy: admin.id,
// //         verifiedAt: new Date(),
// //         paymentProof: 'https://example.com/slip.jpg'
// //       }
// //     })

//     // อัปเดตจำนวนผู้พักในห้องนั้น
// //     await prisma.room.update({
// //       where: { id: room.id },
// //       data: { currentOccupancy: 1, status: RoomStatus.AVAILABLE }
// //     })
// //   }

// //   console.log('✅ Seed data successfully created.')
// }

// main()
//   .catch((e) => {
//     console.error(e)
//     process.exit(1)
//   })
//   .finally(async () => {
//     await prisma.$disconnect()
//   })