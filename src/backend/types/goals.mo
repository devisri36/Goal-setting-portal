import CommonTypes "common";

module {
  public type UserId    = CommonTypes.UserId;
  public type Timestamp = CommonTypes.Timestamp;

  public type User = {
    id         : UserId;
    name       : Text;
    email      : Text;
    role       : CommonTypes.UserRole;
    managerId  : ?UserId;
    department : Text;
    demoKey    : Text;
  };

  public type ThrustArea = {
    id          : Text;
    name        : Text;
    description : Text;
  };

  public type Goal = {
    id           : Text;
    employeeId   : UserId;
    thrustAreaId : Text;
    title        : Text;
    description  : Text;
    uomType      : CommonTypes.UoMType;
    uomDirection : ?CommonTypes.UoMDirection;
    target       : Float;
    weightage    : Float;
    status       : CommonTypes.GoalStatus;
    isShared     : Bool;
    sharedFromId : ?Text;
    createdAt    : Timestamp;
    updatedAt    : Timestamp;
  };

  public type Achievement = {
    id                : Text;
    goalId            : Text;
    employeeId        : UserId;
    period            : CommonTypes.CheckInPeriod;
    actual            : Float;
    completionDate    : ?Timestamp;
    achievementStatus : CommonTypes.AchievementStatus;
    progressScore     : Float;
    updatedAt         : Timestamp;
  };

  public type ManagerCheckIn = {
    id         : Text;
    goalId     : Text;
    managerId  : UserId;
    employeeId : UserId;
    period     : CommonTypes.CheckInPeriod;
    comment    : Text;
    createdAt  : Timestamp;
  };

  public type AuditLog = {
    id            : Text;
    goalId        : Text;
    changedBy     : UserId;
    changedByName : Text;
    field         : Text;
    oldValue      : Text;
    newValue      : Text;
    timestamp     : Timestamp;
  };

  public type SharedGoal = {
    id              : Text;
    sourceGoalId    : Text;
    employeeId      : UserId;
    customWeightage : Float;
  };

  /// Row returned by getAchievementReport
  public type AchievementReportRow = {
    user         : User;
    goals        : [Goal];
    achievements : [Achievement];
  };

  /// Row returned by getCompletionDashboard
  public type CompletionDashboardRow = {
    user      : User;
    submitted : Bool;
    approved  : Bool;
    q1Done    : Bool;
    q2Done    : Bool;
    q3Done    : Bool;
    q4Done    : Bool;
  };
};
