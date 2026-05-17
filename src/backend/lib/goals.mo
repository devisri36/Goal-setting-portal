import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Float "mo:core/Float";
import CommonTypes "../types/common";
import GoalTypes "../types/goals";

module {
  // -- Type re-exports used by callers --
  public type User              = GoalTypes.User;
  public type ThrustArea        = GoalTypes.ThrustArea;
  public type Goal              = GoalTypes.Goal;
  public type Achievement       = GoalTypes.Achievement;
  public type ManagerCheckIn    = GoalTypes.ManagerCheckIn;
  public type AuditLog          = GoalTypes.AuditLog;
  public type SharedGoal        = GoalTypes.SharedGoal;
  public type UserId            = GoalTypes.UserId;
  public type CheckInPeriod     = CommonTypes.CheckInPeriod;
  public type GoalStatus        = CommonTypes.GoalStatus;
  public type AchievementStatus = CommonTypes.AchievementStatus;
  public type UoMType           = CommonTypes.UoMType;
  public type UoMDirection      = CommonTypes.UoMDirection;
  public type Result<T, E>      = CommonTypes.Result<T, E>;

  // -- State container passed to every lib function --
  public type State = {
    users         : Map.Map<Text, User>;
    demoKeys      : Map.Map<Text, Text>;   // demoKey -> userId (principal text)
    sessions      : Map.Map<Text, Text>;   // caller principal text -> userId text
    thrustAreas   : List.List<ThrustArea>;
    goals         : Map.Map<Text, Goal>;
    achievements  : Map.Map<Text, Achievement>;
    checkIns      : Map.Map<Text, ManagerCheckIn>;
    auditLogs     : List.List<AuditLog>;
    sharedGoals   : Map.Map<Text, SharedGoal>;
    counters      : {
      var nextGoalId    : Nat;
      var nextAchId     : Nat;
      var nextCheckInId : Nat;
      var nextAuditId   : Nat;
      var nextSharedId  : Nat;
    };
  };

  // -- Auth --
  public func getCurrentUser(state : State, caller : UserId) : Result<User, Text> {
    let callerText = caller.toText();
    // Check demo session first
    switch (state.sessions.get(callerText)) {
      case (?userId) {
        switch (state.users.get(userId)) {
          case (?u) #ok(u);
          case null #err("Session user not found");
        };
      };
      case null {
        // Try direct principal match
        switch (state.users.get(callerText)) {
          case (?u) #ok(u);
          case null #err("User not found. Please log in with a demo key.");
        };
      };
    };
  };

  public func loginAsDemo(state : State, caller : UserId, demoKey : Text) : Result<User, Text> {
    let callerText = caller.toText();
    switch (state.demoKeys.get(demoKey)) {
      case (?userId) {
        // Bind caller principal -> userId
        state.sessions.add(callerText, userId);
        switch (state.users.get(userId)) {
          case (?u) #ok(u);
          case null #err("Demo user data missing");
        };
      };
      case null #err("Invalid demo key: " # demoKey);
    };
  };

  // -- Users --
  public func listUsers(state : State) : [User] {
    state.users.values().toArray();
  };

  public func getMyTeam(state : State, caller : UserId) : Result<[User], Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        if (me.role != #Manager and me.role != #Admin) {
          return #err("Only managers and admins can view team members");
        };
        let team = state.users.values().filter(
          func(u : User) : Bool {
            switch (u.managerId) {
              case (?mid) mid == me.id;
              case null false;
            };
          }
        ).toArray();
        #ok(team);
      };
    };
  };

  // -- Thrust Areas --
  public func listThrustAreas(state : State) : [ThrustArea] {
    state.thrustAreas.toArray();
  };

  // -- Goals --
  public func createGoal(
    state        : State,
    caller       : UserId,
    thrustAreaId : Text,
    title        : Text,
    description  : Text,
    uomType      : UoMType,
    uomDirection : ?UoMDirection,
    target       : Float,
    weightage    : Float,
  ) : Result<Goal, Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        if (me.role != #Employee) return #err("Only employees can create goals");
        if (weightage < 10.0) return #err("Minimum weightage per goal is 10%");
        // Count existing goals
        let existing = state.goals.values().filter(
          func(g : Goal) : Bool { g.employeeId == me.id and g.status != #ApprovedLocked }
        ).toArray();
        // Count ALL goals (including locked) for max-8 check
        let allGoals = state.goals.values().filter(
          func(g : Goal) : Bool { g.employeeId == me.id }
        ).toArray();
        if (allGoals.size() >= 8) return #err("Maximum 8 goals per employee allowed");
        // Check total weightage won't exceed 100%
        let currentTotal = allGoals.foldLeft(0.0, func(acc, g) = acc + g.weightage);
        if (currentTotal + weightage > 100.0) {
          return #err("Adding this goal would exceed 100% total weightage. Current total: " # debug_show(currentTotal));
        };
        let now = Time.now();
        let id = "goal-" # debug_show(state.counters.nextGoalId);
        state.counters.nextGoalId += 1;
        let goal : Goal = {
          id;
          employeeId   = me.id;
          thrustAreaId;
          title;
          description;
          uomType;
          uomDirection;
          target;
          weightage;
          status       = #Draft;
          isShared     = false;
          sharedFromId = null;
          createdAt    = now;
          updatedAt    = now;
        };
        state.goals.add(id, goal);
        #ok(goal);
      };
    };
  };

  public func getGoalsByEmployee(state : State, employeeId : UserId) : [Goal] {
    state.goals.values().filter(
      func(g : Goal) : Bool { g.employeeId == employeeId }
    ).toArray();
  };

  public func updateGoal(
    state        : State,
    caller       : UserId,
    goalId       : Text,
    title        : Text,
    description  : Text,
    uomType      : UoMType,
    uomDirection : ?UoMDirection,
    target       : Float,
    weightage    : Float,
  ) : Result<Goal, Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        switch (state.goals.get(goalId)) {
          case null #err("Goal not found");
          case (?goal) {
            if (goal.employeeId != me.id) return #err("Not your goal");
            if (goal.status == #ApprovedLocked) return #err("Goal is locked. Admin must unlock first.");
            if (goal.status == #Submitted or goal.status == #UnderReview) {
              return #err("Cannot edit goal while under review");
            };
            if (goal.isShared) return #err("Shared goals: use updateSharedGoalWeightage to change weightage only");
            if (weightage < 10.0) return #err("Minimum weightage is 10%");
            // Check total weightage won't exceed 100% (excluding this goal's current weightage)
            let otherTotal = state.goals.values().filter(
              func(g : Goal) : Bool { g.employeeId == me.id and g.id != goalId }
            ).foldLeft(0.0, func(acc, g) = acc + g.weightage);
            if (otherTotal + weightage > 100.0) {
              return #err("Total weightage would exceed 100%");
            };
            let updated = { goal with title; description; uomType; uomDirection; target; weightage; updatedAt = Time.now() };
            state.goals.add(goalId, updated);
            #ok(updated);
          };
        };
      };
    };
  };

  public func submitGoalsForApproval(state : State, caller : UserId) : Result<Bool, Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        let myGoals = state.goals.values().filter(
          func(g : Goal) : Bool { g.employeeId == me.id }
        ).toArray();
        if (myGoals.size() == 0) return #err("No goals to submit");
        // Only allow submission of Draft/ReturnedForRework goals
        let submittable = myGoals.filter(
          func(g : Goal) : Bool { g.status == #Draft or g.status == #ReturnedForRework }
        );
        if (submittable.size() == 0) return #err("No goals in Draft or ReturnedForRework status");
        // Total weightage must equal exactly 100%
        let totalWeightage = myGoals.foldLeft(0.0, func(acc, g) = acc + g.weightage);
        if (totalWeightage < 99.9 or totalWeightage > 100.1) {
          return #err("Total weightage must equal exactly 100%. Current total: " # debug_show(totalWeightage));
        };
        let now = Time.now();
        state.goals.forEach(func(id, g) {
          if (g.employeeId == me.id and (g.status == #Draft or g.status == #ReturnedForRework)) {
            state.goals.add(id, { g with status = #Submitted; updatedAt = now });
          };
        });
        #ok(true);
      };
    };
  };

  // -- Manager actions --
  public func managerApproveGoals(state : State, caller : UserId, employeeId : UserId) : Result<Bool, Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        if (me.role != #Manager and me.role != #Admin) return #err("Only managers can approve goals");
        let now = Time.now();
        var found = false;
        state.goals.forEach(func(id, g) {
          if (g.employeeId == employeeId and (g.status == #Submitted or g.status == #UnderReview)) {
            found := true;
            state.goals.add(id, { g with status = #ApprovedLocked; updatedAt = now });
          };
        });
        if (not found) return #err("No submitted goals found for this employee");
        // Audit log
        let auditId = "aud-" # debug_show(state.counters.nextAuditId);
        state.counters.nextAuditId += 1;
        state.auditLogs.add({
          id = auditId;
          goalId = "all";
          changedBy = me.id;
          changedByName = me.name;
          field = "status";
          oldValue = "Submitted";
          newValue = "ApprovedLocked";
          timestamp = now;
        });
        #ok(true);
      };
    };
  };

  public func managerEditGoal(
    state     : State,
    caller    : UserId,
    goalId    : Text,
    target    : ?Float,
    weightage : ?Float,
  ) : Result<Goal, Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        if (me.role != #Manager and me.role != #Admin) return #err("Only managers/admins can edit goals");
        switch (state.goals.get(goalId)) {
          case null #err("Goal not found");
          case (?goal) {
            if (goal.status != #Submitted and goal.status != #UnderReview) {
              return #err("Can only edit goals in Submitted or UnderReview status");
            };
            let now = Time.now();
            let newTarget    = switch (target)    { case (?t) t; case null goal.target    };
            let newWeightage = switch (weightage) { case (?w) w; case null goal.weightage };
            // Audit log field changes
            switch (target) {
              case (?t) {
                let auditId = "aud-" # debug_show(state.counters.nextAuditId);
                state.counters.nextAuditId += 1;
                state.auditLogs.add({
                  id = auditId; goalId;
                  changedBy = me.id; changedByName = me.name;
                  field = "target";
                  oldValue = debug_show(goal.target);
                  newValue = debug_show(t);
                  timestamp = now;
                });
              };
              case null {};
            };
            switch (weightage) {
              case (?w) {
                let auditId = "aud-" # debug_show(state.counters.nextAuditId);
                state.counters.nextAuditId += 1;
                state.auditLogs.add({
                  id = auditId; goalId;
                  changedBy = me.id; changedByName = me.name;
                  field = "weightage";
                  oldValue = debug_show(goal.weightage);
                  newValue = debug_show(w);
                  timestamp = now;
                });
              };
              case null {};
            };
            let updated = { goal with target = newTarget; weightage = newWeightage; status = #UnderReview; updatedAt = now };
            state.goals.add(goalId, updated);
            #ok(updated);
          };
        };
      };
    };
  };

  public func managerReturnGoals(state : State, caller : UserId, employeeId : UserId, reason : Text) : Result<Bool, Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        if (me.role != #Manager and me.role != #Admin) return #err("Only managers can return goals");
        let now = Time.now();
        var found = false;
        state.goals.forEach(func(id, g) {
          if (g.employeeId == employeeId and (g.status == #Submitted or g.status == #UnderReview)) {
            found := true;
            state.goals.add(id, { g with status = #ReturnedForRework; updatedAt = now });
          };
        });
        if (not found) return #err("No submitted goals found for this employee");
        let auditId = "aud-" # debug_show(state.counters.nextAuditId);
        state.counters.nextAuditId += 1;
        state.auditLogs.add({
          id = auditId;
          goalId = "all";
          changedBy = me.id;
          changedByName = me.name;
          field = "status";
          oldValue = "Submitted";
          newValue = "ReturnedForRework: " # reason;
          timestamp = now;
        });
        #ok(true);
      };
    };
  };

  // -- Admin actions --
  public func adminUnlockGoals(state : State, caller : UserId, employeeId : UserId, reason : Text) : Result<Bool, Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        if (me.role != #Admin) return #err("Only admins can unlock goals");
        let now = Time.now();
        var found = false;
        state.goals.forEach(func(id, g) {
          if (g.employeeId == employeeId and g.status == #ApprovedLocked) {
            found := true;
            state.goals.add(id, { g with status = #Draft; updatedAt = now });
          };
        });
        if (not found) return #err("No locked goals found for this employee");
        let auditId = "aud-" # debug_show(state.counters.nextAuditId);
        state.counters.nextAuditId += 1;
        state.auditLogs.add({
          id = auditId;
          goalId = "all";
          changedBy = me.id;
          changedByName = me.name;
          field = "status";
          oldValue = "ApprovedLocked";
          newValue = "Draft (unlocked): " # reason;
          timestamp = now;
        });
        #ok(true);
      };
    };
  };

  // -- Shared goals --
  public func pushSharedGoal(
    state        : State,
    caller       : UserId,
    sourceGoalId : Text,
    employeeIds  : [UserId],
  ) : Result<Bool, Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        if (me.role != #Manager and me.role != #Admin) return #err("Only managers/admins can push shared goals");
        switch (state.goals.get(sourceGoalId)) {
          case null #err("Source goal not found");
          case (?sourceGoal) {
            let now = Time.now();
            for (empId in employeeIds.values()) {
              let goalId = "goal-" # debug_show(state.counters.nextGoalId);
              state.counters.nextGoalId += 1;
              let sharedId = "sg-" # debug_show(state.counters.nextSharedId);
              state.counters.nextSharedId += 1;
              let sharedGoal : Goal = {
                id           = goalId;
                employeeId   = empId;
                thrustAreaId = sourceGoal.thrustAreaId;
                title        = sourceGoal.title;
                description  = sourceGoal.description;
                uomType      = sourceGoal.uomType;
                uomDirection = sourceGoal.uomDirection;
                target       = sourceGoal.target;
                weightage    = 10.0; // default; recipient adjusts
                status       = #Draft;
                isShared     = true;
                sharedFromId = ?sourceGoalId;
                createdAt    = now;
                updatedAt    = now;
              };
              state.goals.add(goalId, sharedGoal);
              state.sharedGoals.add(sharedId, { id = sharedId; sourceGoalId; employeeId = empId; customWeightage = 10.0 });
            };
            #ok(true);
          };
        };
      };
    };
  };

  public func updateSharedGoalWeightage(
    state     : State,
    caller    : UserId,
    goalId    : Text,
    weightage : Float,
  ) : Result<Goal, Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        switch (state.goals.get(goalId)) {
          case null #err("Goal not found");
          case (?goal) {
            if (goal.employeeId != me.id) return #err("Not your goal");
            if (not goal.isShared) return #err("This is not a shared goal");
            if (weightage < 10.0) return #err("Minimum weightage is 10%");
            let updated = { goal with weightage; updatedAt = Time.now() };
            state.goals.add(goalId, updated);
            // Update SharedGoal record too
            state.sharedGoals.forEach(func(sid, sg) {
              let matchesSrc = switch (goal.sharedFromId) { case (?src) sg.sourceGoalId == src; case null false };
              if (matchesSrc and sg.employeeId == me.id) {
                state.sharedGoals.add(sid, { sg with customWeightage = weightage });
              };
            });
            #ok(updated);
          };
        };
      };
    };
  };

  // -- Achievements --
  public func logAchievement(
    state             : State,
    caller            : UserId,
    goalId            : Text,
    period            : CheckInPeriod,
    actual            : Float,
    completionDate    : ?Int,
    achievementStatus : AchievementStatus,
  ) : Result<Achievement, Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        switch (state.goals.get(goalId)) {
          case null #err("Goal not found");
          case (?goal) {
            if (goal.employeeId != me.id) return #err("Not your goal");
            if (goal.status != #ApprovedLocked) return #err("Goal must be approved before logging achievement");
            // Compute progress score
            let rawScore : Float = switch (goal.uomType) {
              case (#Numeric or #Percent) {
                let dir = switch (goal.uomDirection) { case (?d) d; case null #Min };
                switch (dir) {
                  case (#Min) {
                    if (goal.target == 0.0) 0.0
                    else actual / goal.target;
                  };
                  case (#Max) {
                    if (actual == 0.0) 2.0
                    else goal.target / actual;
                  };
                };
              };
              case (#Timeline) {
                switch (completionDate) {
                  case (?cd) {
                    // target stores deadline as Float (nanoseconds cast)
                    let deadline : Int = goal.target.toInt();
                    if (cd <= deadline) 1.0 else 0.5;
                  };
                  case null 0.0;
                };
              };
              case (#ZeroBased) {
                if (actual == 0.0) 1.0 else 0.0;
              };
            };
            // Clamp 0.0..2.0
            let progressScore = if (rawScore < 0.0) 0.0 else if (rawScore > 2.0) 2.0 else rawScore;
            let now = Time.now();
            // Upsert achievement (one record per goal+period)
            let achKey = goalId # "-" # debug_show(period);
            let achId = switch (state.achievements.get(achKey)) {
              case (?existing) existing.id;
              case null {
                let newId = "ach-" # debug_show(state.counters.nextAchId);
                state.counters.nextAchId += 1;
                newId;
              };
            };
            let ach : Achievement = {
              id = achId;
              goalId;
              employeeId = me.id;
              period;
              actual;
              completionDate;
              achievementStatus;
              progressScore;
              updatedAt = now;
            };
            state.achievements.add(achKey, ach);
            // Sync to all linked shared goals
            state.goals.forEach(func(gid, g) {
              if (g.isShared) {
                switch (g.sharedFromId) {
                  case (?srcId) {
                    if (srcId == goalId) {
                      let sharedAchKey = gid # "-" # debug_show(period);
                      let sharedAchId = switch (state.achievements.get(sharedAchKey)) {
                        case (?ea) ea.id;
                        case null {
                          let sid = "ach-" # debug_show(state.counters.nextAchId);
                          state.counters.nextAchId += 1;
                          sid;
                        };
                      };
                      state.achievements.add(sharedAchKey, {
                        ach with id = sharedAchId; goalId = gid; employeeId = g.employeeId;
                      });
                    };
                  };
                  case null {};
                };
              };
            });
            #ok(ach);
          };
        };
      };
    };
  };

  public func getAchievementsByEmployee(state : State, employeeId : UserId, period : CheckInPeriod) : [Achievement] {
    state.achievements.values().filter(
      func(a : Achievement) : Bool { a.employeeId == employeeId and a.period == period }
    ).toArray();
  };

  // -- Manager check-ins --
  public func addCheckInComment(
    state      : State,
    caller     : UserId,
    goalId     : Text,
    employeeId : UserId,
    period     : CheckInPeriod,
    comment    : Text,
  ) : Result<ManagerCheckIn, Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        if (me.role != #Manager and me.role != #Admin) return #err("Only managers can add check-in comments");
        let now = Time.now();
        let ciKey = goalId # "-" # debug_show(period);
        let ciId = switch (state.checkIns.get(ciKey)) {
          case (?existing) existing.id;
          case null {
            let newId = "ci-" # debug_show(state.counters.nextCheckInId);
            state.counters.nextCheckInId += 1;
            newId;
          };
        };
        let checkIn : ManagerCheckIn = {
          id = ciId;
          goalId;
          managerId  = me.id;
          employeeId;
          period;
          comment;
          createdAt  = now;
        };
        state.checkIns.add(ciKey, checkIn);
        #ok(checkIn);
      };
    };
  };

  public func getCheckInComments(
    state      : State,
    caller     : UserId,
    employeeId : UserId,
    period     : CheckInPeriod,
  ) : Result<[ManagerCheckIn], Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        if (me.role != #Manager and me.role != #Admin) return #err("Only managers can view check-in comments");
        let results = state.checkIns.values().filter(
          func(ci : ManagerCheckIn) : Bool { ci.employeeId == employeeId and ci.period == period }
        ).toArray();
        #ok(results);
      };
    };
  };

  // -- Audit --
  public func getAuditLog(state : State, goalId : ?Text) : [AuditLog] {
    switch (goalId) {
      case null state.auditLogs.toArray();
      case (?gid) {
        state.auditLogs.filter(
          func(a : AuditLog) : Bool { a.goalId == gid or a.goalId == "all" }
        ).toArray();
      };
    };
  };

  // -- Reporting --
  public func getAchievementReport(
    state  : State,
    caller : UserId,
    period : CheckInPeriod,
  ) : Result<[GoalTypes.AchievementReportRow], Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        if (me.role != #Manager and me.role != #Admin) return #err("Only managers/admins can view achievement reports");
        let rows = state.users.values().filter(
          func(u : User) : Bool { u.role == #Employee }
        ).map(func(u) {
          let userGoals = state.goals.values().filter(
            func(g : Goal) : Bool { g.employeeId == u.id }
          ).toArray();
          let userAchs = state.achievements.values().filter(
            func(a : Achievement) : Bool { a.employeeId == u.id and a.period == period }
          ).toArray();
          { user = u; goals = userGoals; achievements = userAchs };
        }).toArray();
        #ok(rows);
      };
    };
  };

  public func getCompletionDashboard(
    state  : State,
    caller : UserId,
  ) : Result<[GoalTypes.CompletionDashboardRow], Text> {
    switch (getCurrentUser(state, caller)) {
      case (#err(e)) #err(e);
      case (#ok(me)) {
        if (me.role != #Manager and me.role != #Admin) return #err("Only managers/admins can view the completion dashboard");
        let rows = state.users.values().filter(
          func(u : User) : Bool { u.role == #Employee }
        ).map(func(u) {
          let userGoals = state.goals.values().filter(
            func(g : Goal) : Bool { g.employeeId == u.id }
          ).toArray();
          let submitted  = userGoals.any(func(g : Goal) : Bool { g.status == #Submitted or g.status == #UnderReview or g.status == #ApprovedLocked });
          let approved   = userGoals.any(func(g : Goal) : Bool { g.status == #ApprovedLocked });
          let hasAch = func(p : CommonTypes.CheckInPeriod) : Bool {
            state.achievements.values().any(
              func(a : Achievement) : Bool { a.employeeId == u.id and a.period == p }
            );
          };
          {
            user      = u;
            submitted;
            approved;
            q1Done    = hasAch(#Q1);
            q2Done    = hasAch(#Q2);
            q3Done    = hasAch(#Q3);
            q4Done    = hasAch(#Q4Annual);
          };
        }).toArray();
        #ok(rows);
      };
    };
  };
};
