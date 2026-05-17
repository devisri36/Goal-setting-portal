import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import GoalLib "lib/goals";
import GoalsMixin "mixins/goals-api";

actor {
  // -- Stable state --
  let users        = Map.empty<Text, GoalLib.User>();
  let demoKeys     = Map.empty<Text, Text>();
  let sessions     = Map.empty<Text, Text>();
  let thrustAreas  = List.empty<GoalLib.ThrustArea>();
  let goals        = Map.empty<Text, GoalLib.Goal>();
  let achievements = Map.empty<Text, GoalLib.Achievement>();
  let checkIns     = Map.empty<Text, GoalLib.ManagerCheckIn>();
  let auditLogs    = List.empty<GoalLib.AuditLog>();
  let sharedGoals  = Map.empty<Text, GoalLib.SharedGoal>();
  let counters     = {
    var nextGoalId    = 0;
    var nextAchId     = 0;
    var nextCheckInId = 0;
    var nextAuditId   = 0;
    var nextSharedId  = 0;
  };

  let state : GoalLib.State = {
    users;
    demoKeys;
    sessions;
    thrustAreas;
    goals;
    achievements;
    checkIns;
    auditLogs;
    sharedGoals;
    counters;
  };

  // -- Seed demo data (idempotent) --
  // Placeholder principal — will be overridden by session login
  let placeholder = Principal.fromText("2vxsx-fae");

  // Seed manager first so employee managerId can reference it
  let mgrId = "demo-mgr1";
  if (not users.containsKey(mgrId)) {
    let mgr : GoalLib.User = {
      id         = placeholder;
      name       = "Carol Davis";
      email      = "carol@company.com";
      role       = #Manager;
      managerId  = null;
      department = "Sales";
      demoKey    = "mgr1";
    };
    users.add(mgrId, mgr);
    demoKeys.add("mgr1", mgrId);
  };

  let adminId = "demo-admin1";
  if (not users.containsKey(adminId)) {
    let adm : GoalLib.User = {
      id         = placeholder;
      name       = "David HR";
      email      = "david@company.com";
      role       = #Admin;
      managerId  = null;
      department = "HR";
      demoKey    = "admin1";
    };
    users.add(adminId, adm);
    demoKeys.add("admin1", adminId);
  };

  let emp1Id = "demo-emp1";
  if (not users.containsKey(emp1Id)) {
    let emp1 : GoalLib.User = {
      id         = placeholder;
      name       = "Alice Johnson";
      email      = "alice@company.com";
      role       = #Employee;
      managerId  = ?placeholder; // linked by session; placeholder for now
      department = "Sales";
      demoKey    = "emp1";
    };
    users.add(emp1Id, emp1);
    demoKeys.add("emp1", emp1Id);
  };

  let emp2Id = "demo-emp2";
  if (not users.containsKey(emp2Id)) {
    let emp2 : GoalLib.User = {
      id         = placeholder;
      name       = "Bob Smith";
      email      = "bob@company.com";
      role       = #Employee;
      managerId  = ?placeholder;
      department = "Engineering";
      demoKey    = "emp2";
    };
    users.add(emp2Id, emp2);
    demoKeys.add("emp2", emp2Id);
  };

  // Seed thrust areas (idempotent by checking list size)
  if (thrustAreas.isEmpty()) {
    let areas = [
      ("ta-1", "Revenue Growth",       "Drive top-line revenue growth"),
      ("ta-2", "Cost Optimization",     "Reduce operational costs"),
      ("ta-3", "Customer Satisfaction", "Improve customer NPS and satisfaction scores"),
      ("ta-4", "Process Excellence",    "Improve operational processes and efficiency"),
      ("ta-5", "People Development",    "Build team capabilities and career growth"),
      ("ta-6", "Innovation",            "Drive new ideas and R&D"),
      ("ta-7", "Safety & Compliance",   "Ensure safety and regulatory compliance"),
    ];
    for ((id, name, desc) in areas.values()) {
      thrustAreas.add({ id; name; description = desc });
    };
  };

  // -- Mixin inclusion --
  include GoalsMixin(state);
};

