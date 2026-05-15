const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const vm = require("vm");

const mockCookies = jest.fn();
const mockJwtVerify = jest.fn();
const mockSendStatusEmail = jest.fn();
const mockSendBookingStatusFlex = jest.fn();

const mockPrisma = {
  $transaction: jest.fn(),
  booking: {
    findUnique: jest.fn(),
  },
};

const routeMocks = {
  "@/lib/prisma": { prisma: mockPrisma },
  "@/lib/mail": { sendStatusEmail: mockSendStatusEmail },
  "@/lib/line": { sendBookingStatusFlex: mockSendBookingStatusFlex },
  "next/headers": { cookies: mockCookies },
  jose: { jwtVerify: mockJwtVerify },
  "@/utils/types": {
    BookingStatus: {
      VERIFYING: "VERIFYING",
      COMPLETED: "COMPLETED",
      REJECTED: "REJECTED",
      PENDING_CORRECTION: "PENDING_CORRECTION",
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

const makeRequest = (body) => ({
  json: jest.fn().mockResolvedValue(body),
});

const setAdminCookie = (token) => {
  mockCookies.mockResolvedValue({
    get: jest.fn((name) => (name === "admin-token" ? { value: token } : undefined)),
  });
};

const setNoAdminCookie = () => {
  mockCookies.mockResolvedValue({
    get: jest.fn(() => undefined),
  });
};

const adminRoutes = [
  {
    name: "confirm booking",
    path: "../../app/api/admin/bookings/confirm/route.ts",
  },
  {
    name: "reject booking",
    path: "../../app/api/admin/bookings/reject/route.ts",
  },
  {
    name: "request booking edit",
    path: "../../app/api/admin/bookings/request-edit/route.ts",
  },
];

const mockConfirmSuccess = () => {
  const tx = {
    booking: {
      findUnique: jest.fn().mockResolvedValue({ status: "VERIFYING" }),
      update: jest.fn().mockResolvedValue({}),
    },
    booking_log: {
      create: jest.fn().mockResolvedValue({
        bookingId: 55,
        status: "COMPLETED",
        booking: {
          cus_users: { id: 501 },
          room: { roomId: "A101", dorm: { name: "Test Dorm" } },
        },
      }),
    },
    staff_action_log: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));
  mockPrisma.booking.findUnique.mockResolvedValue({
    cus_users: { email: "student@example.com" },
    room: { dorm: { campus: {} } },
  });

  return tx;
};

const mockRejectSuccess = () => {
  const tx = {
    booking: {
      findUnique: jest.fn().mockResolvedValue({
        status: "VERIFYING",
        type: "NOT_CHARTER",
        room: {
          id: 10,
          currentOccupancy: 1,
          parentId: null,
          facultyConfig: ["Engineering"],
        },
        cus_users: { faculty_department: "Engineering" },
      }),
      update: jest.fn().mockResolvedValue({ id: 55, status: "REJECTED" }),
    },
    booking_log: {
      create: jest.fn().mockResolvedValue({
        bookingId: 55,
        status: "REJECTED",
        booking: {
          cus_users: { id: 501 },
          room: { roomId: "A101", dorm: { name: "Test Dorm" } },
        },
      }),
    },
    staff_action_log: {
      create: jest.fn().mockResolvedValue({}),
    },
    room: {
      update: jest.fn().mockResolvedValue({}),
    },
  };

  mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));
  mockPrisma.booking.findUnique.mockResolvedValue({
    cus_users: { email: "student@example.com" },
    room: { dorm: { campus: {} } },
  });

  return tx;
};

const mockRequestEditSuccess = () => {
  const tx = {
    booking_log: {
      create: jest.fn().mockResolvedValue({}),
    },
    booking: {
      update: jest.fn().mockResolvedValue({}),
    },
    staff_action_log: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));
  mockPrisma.booking.findUnique.mockResolvedValue({
    id: 55,
    status: "PENDING_CORRECTION",
    cus_users: { id: 501, email: "student@example.com" },
    room: { roomId: "A101", dorm: { name: "Test Dorm", campus: {} } },
  });

  return tx;
};

describe("Admin booking route", () => {
  const originalJwtSecretAdmin = process.env.JWT_SECRET_ADMIN;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET_ADMIN = "test-admin-secret";
    mockSendStatusEmail.mockResolvedValue(undefined);
    mockSendBookingStatusFlex.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env.JWT_SECRET_ADMIN = originalJwtSecretAdmin;
  });

  describe.each(adminRoutes)("$name", ({ path: routePath }) => {
    it("reject requests without an admin token", async () => {
      setNoAdminCookie();
      const { POST } = loadRoute(routePath);

      const response = await POST(makeRequest({ bookingId: 55, remark: "ok" }));
      const payload = await response.json();

      expect(response.status).toBe(401);
      expect(payload).toEqual({ message: "Unauthorized" });
      expect(mockJwtVerify).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("reject a valid token that does not belong to an admin", async () => {
      setAdminCookie("student-token");
      mockJwtVerify.mockResolvedValue({ payload: { id: 777, role: "STUDENT" } });
      const { POST } = loadRoute(routePath);

      const response = await POST(makeRequest({ bookingId: 55, remark: "ok" }));
      const payload = await response.json();

      expect(response.status).toBe(401);
      expect(payload).toEqual({ message: "Unauthorized" });
      expect(mockJwtVerify).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  it("allow admin to confirm a booking", async () => {
    setAdminCookie("admin-token");
    mockJwtVerify.mockResolvedValue({ payload: { id: 10, role: "ADMIN" } });
    const tx = mockConfirmSuccess();
    const { POST } = loadRoute("../../app/api/admin/bookings/confirm/route.ts");

    const response = await POST(makeRequest({ bookingId: 55, remark: "approved" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true, message: "อนุมัติรายการเรียบร้อย" });
    expect(tx.booking_log.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: 55,
          status: "COMPLETED",
          verifiedBy: 10,
        }),
      }),
    );
  });

  it("allow admin to reject a booking", async () => {
    setAdminCookie("admin-token");
    mockJwtVerify.mockResolvedValue({ payload: { id: 10, role: "ADMIN" } });
    const tx = mockRejectSuccess();
    const { POST } = loadRoute("../../app/api/admin/bookings/reject/route.ts");

    const response = await POST(makeRequest({ bookingId: 55, remark: "invalid proof" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true });
    expect(tx.booking_log.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: 55,
          status: "REJECTED",
          verifiedBy: 10,
        }),
      }),
    );
    expect(tx.room.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        currentOccupancy: 0,
        status: "AVAILABLE",
        lifestyleConfig: null,
        lifestyleNote: null,
        facultyConfig: [],
      },
    });
  });

  it("allow admin to request a booking edit", async () => {
    setAdminCookie("admin-token");
    mockJwtVerify.mockResolvedValue({ payload: { id: 10, role: "ADMIN" } });
    const tx = mockRequestEditSuccess();
    const { POST } = loadRoute("../../app/api/admin/bookings/request-edit/route.ts");

    const response = await POST(makeRequest({ bookingId: 55, remark: "upload clearer proof" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true });
    expect(tx.booking_log.create).toHaveBeenCalledWith({
      data: {
        bookingId: 55,
        status: "PENDING_CORRECTION",
        verifiedBy: 10,
      },
    });
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: 55 },
      data: { status: "PENDING_CORRECTION" },
    });
  });
});
