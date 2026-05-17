import CommonTypes "../types/common";
import GoalTypes "../types/goals";
import GoalLib "../lib/goals";

mixin (state : GoalLib.State) {

  // -- Auth --

  public shared ({ caller }) func whoami() : async Principal {
    caller;
  };

  public shared ({ caller }) func loginAsDemo(demoKey : Text) : async CommonTypes.Result<GoalTypes.User, Text> {
    GoalLib.loginAsDemo(state, caller, demoKey);
  };

  public shared ({ caller }) func getCurrentUser() : async CommonTypes.Result<GoalTypes.User, Text> {
    GoalLib.getCurrentUser(state, caller);
  };

  // -- Users --

  public shared query func getUsers() : async [GoalTypes.User] {
    GoalLib.listUsers(state);
  };

  public shared ({ caller }) func getMyTeam() : async CommonTypes.Result<[GoalTypes.User], Text> {
    GoalLib.getMyTeam(state, caller);
  };

  // -- Thrust Areas --

  public shared query func getThrustAreas() : async [GoalTypes.ThrustArea] {
    GoalLib.listThrustAreas(state);
  };

  // -- Goals --

  public shared ({ caller }) func createGoal(
    thrustAreaId : Text,
    title        : Text,
    description  : Text,
    uomType      : CommonTypes.UoMType,
    uomDirection : ?CommonTypes.UoMDirection,
    target       : Float,
    weightage    : Float,
  ) : async CommonTypes.Result<GoalTypes.Goal, Text> {
    GoalLib.createGoal(state, caller, thrustAreaId, title, description, uomType, uomDirection, target, weightage);
  };

  public shared query ({ caller }) func getMyGoals() : async CommonTypes.Result<[GoalTypes.Goal], Text> {
    switch (GoalLib.getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) #ok(GoalLib.getGoalsByEmployee(state, me.id));
    };
  };

  public shared query ({ caller }) func getEmployeeGoals(employeeId : Principal) : async CommonTypes.Result<[GoalTypes.Goal], Text> {
    switch (GoalLib.getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(_me)) #ok(GoalLib.getGoalsByEmployee(state, employeeId));
    };
  };

  public shared ({ caller }) func updateGoal(
    goalId       : Text,
    title        : Text,
    description  : Text,
    uomType      : CommonTypes.UoMType,
    uomDirection : ?CommonTypes.UoMDirection,
    target       : Float,
    weightage    : Float,
  ) : async CommonTypes.Result<GoalTypes.Goal, Text> {
    GoalLib.updateGoal(state, caller, goalId, title, description, uomType, uomDirection, target, weightage);
  };

  public shared ({ caller }) func submitGoalsForApproval() : async CommonTypes.Result<Bool, Text> {
    GoalLib.submitGoalsForApproval(state, caller);
  };

  public shared ({ caller }) func managerApproveGoals(employeeId : Principal) : async CommonTypes.Result<Bool, Text> {
    GoalLib.managerApproveGoals(state, caller, employeeId);
  };

  public shared ({ caller }) func managerEditGoal(
    goalId    : Text,
    target    : ?Float,
    weightage : ?Float,
  ) : async CommonTypes.Result<GoalTypes.Goal, Text> {
    GoalLib.managerEditGoal(state, caller, goalId, target, weightage);
  };

  public shared ({ caller }) func managerReturnGoals(employeeId : Principal, reason : Text) : async CommonTypes.Result<Bool, Text> {
    GoalLib.managerReturnGoals(state, caller, employeeId, reason);
  };

  public shared ({ caller }) func adminUnlockGoals(employeeId : Principal, reason : Text) : async CommonTypes.Result<Bool, Text> {
    GoalLib.adminUnlockGoals(state, caller, employeeId, reason);
  };

  public shared ({ caller }) func pushSharedGoal(sourceGoalId : Text, employeeIds : [Principal]) : async CommonTypes.Result<Bool, Text> {
    GoalLib.pushSharedGoal(state, caller, sourceGoalId, employeeIds);
  };

  public shared ({ caller }) func updateSharedGoalWeightage(goalId : Text, weightage : Float) : async CommonTypes.Result<GoalTypes.Goal, Text> {
    GoalLib.updateSharedGoalWeightage(state, caller, goalId, weightage);
  };

  // -- Achievements --

  public shared ({ caller }) func logAchievement(
    goalId            : Text,
    period            : CommonTypes.CheckInPeriod,
    actual            : Float,
    completionDate    : ?Int,
    achievementStatus : CommonTypes.AchievementStatus,
  ) : async CommonTypes.Result<GoalTypes.Achievement, Text> {
    GoalLib.logAchievement(state, caller, goalId, period, actual, completionDate, achievementStatus);
  };

  public shared query ({ caller }) func getMyAchievements(period : CommonTypes.CheckInPeriod) : async CommonTypes.Result<[GoalTypes.Achievement], Text> {
    switch (GoalLib.getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) #ok(GoalLib.getAchievementsByEmployee(state, me.id, period));
    };
  };

  public shared query ({ caller }) func getEmployeeAchievements(
    employeeId : Principal,
    period     : CommonTypes.CheckInPeriod,
  ) : async CommonTypes.Result<[GoalTypes.Achievement], Text> {
    switch (GoalLib.getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(_me)) #ok(GoalLib.getAchievementsByEmployee(state, employeeId, period));
    };
  };

  // -- Manager Check-ins --

  public shared ({ caller }) func addCheckInComment(
    goalId     : Text,
    employeeId : Principal,
    period     : CommonTypes.CheckInPeriod,
    comment    : Text,
  ) : async CommonTypes.Result<GoalTypes.ManagerCheckIn, Text> {
    GoalLib.addCheckInComment(state, caller, goalId, employeeId, period, comment);
  };

  public shared query ({ caller }) func getCheckInComments(
    employeeId : Principal,
    period     : CommonTypes.CheckInPeriod,
  ) : async CommonTypes.Result<[GoalTypes.ManagerCheckIn], Text> {
    GoalLib.getCheckInComments(state, caller, employeeId, period);
  };

  // -- Audit --

  public shared query func getAuditLog(goalId : ?Text) : async [GoalTypes.AuditLog] {
    GoalLib.getAuditLog(state, goalId);
  };

  // -- Reporting --

  public shared ({ caller }) func getAchievementReport(period : CommonTypes.CheckInPeriod) : async CommonTypes.Result<[GoalTypes.AchievementReportRow], Text> {
    GoalLib.getAchievementReport(state, caller, period);
  };

  public shared ({ caller }) func getCompletionDashboard() : async CommonTypes.Result<[GoalTypes.CompletionDashboardRow], Text> {
    GoalLib.getCompletionDashboard(state, caller);
  };

};
