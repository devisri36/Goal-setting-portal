import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ThrustArea {
    id: string;
    name: string;
    description: string;
}
export type Timestamp = bigint;
export type Result_2 = {
    __kind__: "ok";
    ok: User;
} | {
    __kind__: "err";
    err: string;
};
export interface AuditLog {
    id: string;
    field: string;
    changedByName: string;
    oldValue: string;
    changedBy: UserId;
    newValue: string;
    goalId: string;
    timestamp: Timestamp;
}
export type Result_6 = {
    __kind__: "ok";
    ok: Array<Achievement>;
} | {
    __kind__: "err";
    err: string;
};
export interface User {
    id: UserId;
    name: string;
    role: UserRole;
    email: string;
    demoKey: string;
    managerId?: UserId;
    department: string;
}
export type Result_5 = {
    __kind__: "ok";
    ok: Array<Goal>;
} | {
    __kind__: "err";
    err: string;
};
export type Result_9 = {
    __kind__: "ok";
    ok: Array<AchievementReportRow>;
} | {
    __kind__: "err";
    err: string;
};
export type Result_1 = {
    __kind__: "ok";
    ok: boolean;
} | {
    __kind__: "err";
    err: string;
};
export interface Achievement {
    id: string;
    actual: number;
    completionDate?: Timestamp;
    period: CheckInPeriod;
    progressScore: number;
    goalId: string;
    achievementStatus: AchievementStatus;
    updatedAt: Timestamp;
    employeeId: UserId;
}
export type Result_4 = {
    __kind__: "ok";
    ok: Array<User>;
} | {
    __kind__: "err";
    err: string;
};
export type UserId = Principal;
export type Result = {
    __kind__: "ok";
    ok: Goal;
} | {
    __kind__: "err";
    err: string;
};
export type Result_3 = {
    __kind__: "ok";
    ok: Achievement;
} | {
    __kind__: "err";
    err: string;
};
export type Result_10 = {
    __kind__: "ok";
    ok: ManagerCheckIn;
} | {
    __kind__: "err";
    err: string;
};
export type Result_8 = {
    __kind__: "ok";
    ok: Array<ManagerCheckIn>;
} | {
    __kind__: "err";
    err: string;
};
export interface AchievementReportRow {
    user: User;
    achievements: Array<Achievement>;
    goals: Array<Goal>;
}
export type Result_7 = {
    __kind__: "ok";
    ok: Array<CompletionDashboardRow>;
} | {
    __kind__: "err";
    err: string;
};
export interface ManagerCheckIn {
    id: string;
    period: CheckInPeriod;
    createdAt: Timestamp;
    goalId: string;
    comment: string;
    employeeId: UserId;
    managerId: UserId;
}
export interface CompletionDashboardRow {
    q2Done: boolean;
    submitted: boolean;
    q4Done: boolean;
    user: User;
    q1Done: boolean;
    approved: boolean;
    q3Done: boolean;
}
export interface Goal {
    id: string;
    status: GoalStatus;
    weightage: number;
    title: string;
    createdAt: Timestamp;
    uomType: UoMType;
    description: string;
    sharedFromId?: string;
    isShared: boolean;
    uomDirection?: UoMDirection;
    updatedAt: Timestamp;
    target: number;
    employeeId: UserId;
    thrustAreaId: string;
}
export enum AchievementStatus {
    OnTrack = "OnTrack",
    Completed = "Completed",
    NotStarted = "NotStarted"
}
export enum CheckInPeriod {
    Q1 = "Q1",
    Q2 = "Q2",
    Q3 = "Q3",
    Q4Annual = "Q4Annual"
}
export enum GoalStatus {
    ApprovedLocked = "ApprovedLocked",
    UnderReview = "UnderReview",
    Draft = "Draft",
    ReturnedForRework = "ReturnedForRework",
    Submitted = "Submitted"
}
export enum UoMDirection {
    Max = "Max",
    Min = "Min"
}
export enum UoMType {
    Percent = "Percent",
    Numeric = "Numeric",
    Timeline = "Timeline",
    ZeroBased = "ZeroBased"
}
export enum UserRole {
    Employee = "Employee",
    Admin = "Admin",
    Manager = "Manager"
}
export interface backendInterface {
    addCheckInComment(goalId: string, employeeId: Principal, period: CheckInPeriod, comment: string): Promise<Result_10>;
    adminUnlockGoals(employeeId: Principal, reason: string): Promise<Result_1>;
    createGoal(thrustAreaId: string, title: string, description: string, uomType: UoMType, uomDirection: UoMDirection | null, target: number, weightage: number): Promise<Result>;
    getAchievementReport(period: CheckInPeriod): Promise<Result_9>;
    getAuditLog(goalId: string | null): Promise<Array<AuditLog>>;
    getCheckInComments(employeeId: Principal, period: CheckInPeriod): Promise<Result_8>;
    getCompletionDashboard(): Promise<Result_7>;
    getCurrentUser(): Promise<Result_2>;
    getEmployeeAchievements(employeeId: Principal, period: CheckInPeriod): Promise<Result_6>;
    getEmployeeGoals(employeeId: Principal): Promise<Result_5>;
    getMyAchievements(period: CheckInPeriod): Promise<Result_6>;
    getMyGoals(): Promise<Result_5>;
    getMyTeam(): Promise<Result_4>;
    getThrustAreas(): Promise<Array<ThrustArea>>;
    getUsers(): Promise<Array<User>>;
    logAchievement(goalId: string, period: CheckInPeriod, actual: number, completionDate: bigint | null, achievementStatus: AchievementStatus): Promise<Result_3>;
    loginAsDemo(demoKey: string): Promise<Result_2>;
    managerApproveGoals(employeeId: Principal): Promise<Result_1>;
    managerEditGoal(goalId: string, target: number | null, weightage: number | null): Promise<Result>;
    managerReturnGoals(employeeId: Principal, reason: string): Promise<Result_1>;
    pushSharedGoal(sourceGoalId: string, employeeIds: Array<Principal>): Promise<Result_1>;
    submitGoalsForApproval(): Promise<Result_1>;
    updateGoal(goalId: string, title: string, description: string, uomType: UoMType, uomDirection: UoMDirection | null, target: number, weightage: number): Promise<Result>;
    updateSharedGoalWeightage(goalId: string, weightage: number): Promise<Result>;
    whoami(): Promise<Principal>;
}
