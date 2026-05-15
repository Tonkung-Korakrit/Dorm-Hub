const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const vm = require("vm");

const mockSyncProfileImages = jest.fn();
const mockSendBookingStatusFlex = jest.fn();
const mockAxiosPost = jest.fn();
const mockJwtSign = jest.fn();

const mockPrisma = {
  $transaction: jest.fn(),
  cus_users: {
    upsert: jest.fn(),
    update: jest.fn(),
  },
  file_info: {
    create: jest.fn(),
  },
  vehicle: {
    upsert: jest.fn(),
  },
  address: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const routeMocks = {
  "@/lib/prisma": { prisma: mockPrisma },
  "@/lib/profile-images": { syncProfileImages: mockSyncProfileImages },
  "@/lib/line": { sendBookingStatusFlex: mockSendBookingStatusFlex },
  "@/services/identify": { getAuthSession: jest.fn() },
  axios: { post: mockAxiosPost },
  jsonwebtoken: { sign: mockJwtSign },
  "@/utils/types": {
    BookingStatus: {
      PENDING: "PENDING",
    },
    BookingType: {
      CHARTER: "CHARTER",
      NOT_CHARTER: "NOT_CHARTER",
      CO_RESIDENT: "CO_RESIDENT",
    },
    RoomStatus: {
      AVAILABLE: "AVAILABLE",
      PENDING: "PENDING",
      FULL: "FULL",
    },
    Role: {
      STUDENT: "STUDENT",
    },
  },
};

const loadRoute = (routeRelativePath) => {
  const routePath = path.resolve(__dirname, routeRelativePath);
  const source = fs.readFileSync(routePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };
  const customRequire = (request) => routeMocks[request] || require(request);
  const script = new vm.Script(
    `(function (require, module, exports, process) { ${compiled}\n })`,
    { filename: routePath },
  );

  script.runInThisContext()(customRequire, module, module.exports, process);
  return module.exports;
};

const { POST } = loadRoute("../../app/api/bookings/route.ts");

const createDeferred = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

const makeBody = (userId) => ({
  user: {
    id: userId,
    citizenType: "THAI",
    citizenNumber: `11000000000${userId}`,
    studentId: `6600000${userId}`,
    isScholarshipStudent: false,
    isDisabled: false,
    gender: "MALE",
    titleName: "Mr.",
    name_th: `ผู้ทดสอบ ${userId}`,
    name_en: `Test User ${userId}`,
    birthDate: "2000-01-01",
    mobilePhone: "0800000000",
    email: `user${userId}@example.com`,
    faculty_department: "Engineering",
    lifestyle: ["QUIET"],
    lifestyleNote: "Sleeps early",
  },
  room: {
    id: 1,
    capacity: 1,
    price: 5000,
  },
  type: "NOT_CHARTER",
  groupId: null,
  address: {
    type: "CURRENT",
    addressDetail: "99 Test Road",
    country: "Thailand",
    district: "Khlong Luang",
    postalCode: "12120",
    province: "Pathum Thani",
    subDistrict: "Khlong Nueng",
  },
  profileImages: [],
});

const makeRequest = (body) => ({
  json: jest.fn().mockResolvedValue(body),
});

describe("Booking Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.cus_users.update.mockResolvedValue({});
    mockPrisma.address.findFirst.mockResolvedValue(null);
    mockPrisma.address.create.mockResolvedValue({});
    mockPrisma.address.update.mockResolvedValue({});
    mockPrisma.file_info.create.mockResolvedValue({ id: 1 });
    mockPrisma.vehicle.upsert.mockResolvedValue({});
    mockSyncProfileImages.mockResolvedValue(undefined);
    mockSendBookingStatusFlex.mockResolvedValue(undefined);
  });

  it("Data integrity when booking a room correctly", async () => {
    const body = {
      ...makeBody(201),
      profileImages: [
        { type: "FACE_PHOTO", path: "/uploads/face-201.jpg" },
        { type: "CITIZEN_CARD", path: "/uploads/card-201.jpg" },
      ],
    };
    const targetRoom = {
      id: 1,
      status: "AVAILABLE",
      capacity: 2,
      currentOccupancy: 0,
      parentId: null,
      facultyConfig: ["Science"],
    };
    const bookingResult = {
      id: 99,
      userId: 201,
      roomId: 1,
      type: "NOT_CHARTER",
      status: "PENDING",
      booking_logs: [{ status: "PENDING" }],
      room: {
        roomId: "A101",
        dorm: { name: "Test Dorm" },
      },
    };
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([targetRoom]),
      room: {
        update: jest.fn().mockResolvedValue({
          ...targetRoom,
          currentOccupancy: 1,
          status: "AVAILABLE",
          facultyConfig: ["Science", "Engineering"],
          lifestyleConfig: ["QUIET"],
          lifestyleNote: "Sleeps early",
        }),
        findUnique: jest.fn(),
      },
      booking: {
        create: jest.fn().mockResolvedValue(bookingResult),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const response = await POST(makeRequest(body));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true, booking: bookingResult });
    expect(tx.room.update).toHaveBeenCalledWith({
      where: {
        id: 1,
        status: "AVAILABLE",
        currentOccupancy: 0,
      },
      data: {
        currentOccupancy: 1,
        status: "AVAILABLE",
        facultyConfig: ["Science", "Engineering"],
        lifestyleConfig: ["QUIET"],
        lifestyleNote: "Sleeps early",
      },
    });
    expect(tx.booking.create).toHaveBeenCalledWith({
      data: {
        userId: 201,
        roomId: 1,
        type: "NOT_CHARTER",
        groupId: null,
        status: "PENDING",
        booking_logs: {
          create: {
            status: "PENDING",
            createdAt: expect.anything(),
          },
        },
      },
      include: {
        booking_logs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        room: {
          include: {
            dorm: true,
          },
        },
      },
    });
    expect(mockPrisma.cus_users.update).toHaveBeenCalledWith({
      where: { id: 201 },
      data: expect.objectContaining({
        citizenType: "THAI",
        citizenNumber: "11000000000201",
        studentId: "6600000201",
        name_th: "ผู้ทดสอบ 201",
        name_en: "Test User 201",
        email: "user201@example.com",
        faculty_department: "Engineering",
        lifestyle: ["QUIET"],
        lifestyleNote: "Sleeps early",
        birthDate: expect.anything(),
      }),
    });
    expect(mockSyncProfileImages).toHaveBeenCalledWith(
      mockPrisma,
      201,
      body.profileImages,
    );
    expect(mockPrisma.address.findFirst).toHaveBeenCalledWith({
      where: { userId: 201 },
    });
    expect(mockPrisma.address.create).toHaveBeenCalledWith({
      data: {
        userId: 201,
        ...body.address,
      },
    });
    expect(mockSendBookingStatusFlex).toHaveBeenCalledWith({
      userId: 201,
      bookingId: 99,
      status: "PENDING",
      dormName: "Test Dorm",
      roomCode: "A101",
    });
  });

  it("Booking race condition, two user booking a room at the same time", async () => {
    const readBarrier = createDeferred();
    let reads = 0;
    let nextBookingId = 1;

    const roomState = {
      id: 1,
      status: "AVAILABLE",
      capacity: 1,
      currentOccupancy: 0,
      parentId: null,
      facultyConfig: [],
    };

    const tx = {
      $queryRaw: jest.fn(async () => {
        const snapshot = { ...roomState };
        reads += 1;

        if (reads === 2) {
          readBarrier.resolve();
        }

        await readBarrier.promise;
        return [snapshot];
      }),
      room: {
        update: jest.fn(async ({ where, data }) => {
          if (
            where.id !== roomState.id ||
            where.status !== roomState.status ||
            where.currentOccupancy !== roomState.currentOccupancy
          ) {
            throw new Error("stale room update");
          }

          roomState.currentOccupancy = data.currentOccupancy;
          roomState.status = data.status;

          return { ...roomState };
        }),
        findUnique: jest.fn(),
      },
      booking: {
        create: jest.fn(async ({ data }) => {
          const bookingId = nextBookingId;
          nextBookingId += 1;

          return {
            id: bookingId,
            userId: data.userId,
            roomId: data.roomId,
            type: data.type,
            status: data.status,
            booking_logs: [{ status: "PENDING" }],
            room: {
              roomId: "A101",
              dorm: { name: "Test Dorm" },
            },
          };
        }),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const responses = await Promise.all([
      POST(makeRequest(makeBody(101))),
      POST(makeRequest(makeBody(102))),
    ]);
    const payloads = await Promise.all(responses.map((response) => response.json()));

    expect(payloads).toHaveLength(2);
    expect(payloads.filter((payload) => payload.success)).toHaveLength(1);
    expect(payloads.filter((payload) => !payload.success)).toHaveLength(1);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);

    const failedPayload = payloads.find((payload) => !payload.success);
    expect(failedPayload.error).toContain("ห้องพักถูกจองไปแล้วโดยผู้ใช้อื่น");

    expect(roomState.currentOccupancy).toBe(1);
    expect(roomState.status).toBe("PENDING");
    expect(tx.booking.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
    expect(mockSyncProfileImages).toHaveBeenCalledTimes(1);
    expect(mockSendBookingStatusFlex).toHaveBeenCalledTimes(1);
  });
});

describe("Login Route", () => {
  let loginPost;
  const originalApplicationKey = process.env.APPLICATION_KEY;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalJwtExpiresIn = process.env.JWT_EXPIRES_IN;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.APPLICATION_KEY = "test-application-key";
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.JWT_EXPIRES_IN = "2h";
    process.env.NODE_ENV = "test";
    loginPost = loadRoute("../../app/api/auth/login/route.ts").POST;
  });

  afterAll(() => {
    process.env.APPLICATION_KEY = originalApplicationKey;
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.JWT_EXPIRES_IN = originalJwtExpiresIn;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("Login a TU user correctly, upsert the student, set a token cookie", async () => {
    mockAxiosPost.mockResolvedValue({
      data: {
        status: true,
        username: "6601234567",
        displayname_en: "Test Student",
        displayname_th: "นักศึกษาทดสอบ",
        email: "student@example.com",
      },
    });
    mockPrisma.cus_users.upsert.mockResolvedValue({
      studentId: "6601234567",
      role: "STUDENT",
    });
    mockJwtSign.mockReturnValue("signed-jwt-token");

    const response = await loginPost(
      makeRequest({ username: "6601234567", password: "secret" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ message: "Login successful", ok: true });
    expect(mockAxiosPost).toHaveBeenCalledWith(
      "https://restapi.tu.ac.th/api/v1/auth/Ad/verify",
      {
        UserName: "6601234567",
        PassWord: "secret",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Application-Key": "test-application-key",
        },
      },
    );
    expect(mockPrisma.cus_users.upsert).toHaveBeenCalledWith({
      where: { studentId: "6601234567" },
      update: {
        name_en: "Test Student",
        name_th: "นักศึกษาทดสอบ",
        email: "student@example.com",
      },
      create: {
        studentId: "6601234567",
        name_en: "Test Student",
        name_th: "นักศึกษาทดสอบ",
        email: "student@example.com",
        role: "STUDENT",
      },
      select: { studentId: true, role: true },
    });
    expect(mockJwtSign).toHaveBeenCalledWith(
      { studentId: "6601234567", role: "STUDENT", provider: "TU" },
      "test-jwt-secret",
      { expiresIn: "2h" },
    );
    expect(response.headers.get("set-cookie")).toContain("token=signed-jwt-token");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("return 401 when TU reject the credential", async () => {
    mockAxiosPost.mockResolvedValue({ data: { status: false } });

    const response = await loginPost(
      makeRequest({ username: "wrong", password: "bad-password" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Login failed. Invalid username or password." });
    expect(mockPrisma.cus_users.upsert).not.toHaveBeenCalled();
    expect(mockJwtSign).not.toHaveBeenCalled();
  });

  it("return 500 when the TU API request fail", async () => {
    mockAxiosPost.mockRejectedValue({
      response: { data: { message: "TU API unavailable" } },
    });

    const response = await loginPost(
      makeRequest({ username: "6601234567", password: "secret" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Server error" });
    expect(mockPrisma.cus_users.upsert).not.toHaveBeenCalled();
    expect(mockJwtSign).not.toHaveBeenCalled();
  });
});
