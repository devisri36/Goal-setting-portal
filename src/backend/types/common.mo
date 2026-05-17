import Principal "mo:core/Principal";

module {
  public type UserId = Principal;
  public type Timestamp = Int;

  public type Result<T, E> = { #ok : T; #err : E };

  public type UserRole = {
    #Employee;
    #Manager;
    #Admin;
  };

  public type UoMType = {
    #Numeric;
    #Percent;
    #Timeline;
    #ZeroBased;
  };

  /// Min = higher is better (e.g. Sales Revenue), Max = lower is better (e.g. TAT, Cost)
  public type UoMDirection = {
    #Min;
    #Max;
  };

  public type GoalStatus = {
    #Draft;
    #Submitted;
    #UnderReview;
    #ApprovedLocked;
    #ReturnedForRework;
  };

  public type AchievementStatus = {
    #NotStarted;
    #OnTrack;
    #Completed;
  };

  public type CheckInPeriod = {
    #Q1;
    #Q2;
    #Q3;
    #Q4Annual;
  };
};
