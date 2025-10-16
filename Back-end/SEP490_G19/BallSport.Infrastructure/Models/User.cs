﻿using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class User
{
    public int UserId { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string? Phone { get; set; }

    public byte[]? Avatar { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<BlogPost> BlogPosts { get; set; } = new List<BlogPost>();

    public virtual ICollection<BookingCancellationRequest> BookingCancellationRequestRequestedByUsers { get; set; } = new List<BookingCancellationRequest>();

    public virtual ICollection<BookingCancellationRequest> BookingCancellationRequestReversedByUsers { get; set; } = new List<BookingCancellationRequest>();

    public virtual ICollection<BookingCancellation> BookingCancellations { get; set; } = new List<BookingCancellation>();

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual ICollection<FieldComplex> FieldComplexes { get; set; } = new List<FieldComplex>();

    public virtual ICollection<MatchParticipant> MatchParticipants { get; set; } = new List<MatchParticipant>();

    public virtual ICollection<MatchRequest> MatchRequests { get; set; } = new List<MatchRequest>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<PlayerMatchHistory> PlayerMatchHistories { get; set; } = new List<PlayerMatchHistory>();

    public virtual ICollection<PostLike> PostLikes { get; set; } = new List<PostLike>();

    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();

    public virtual ICollection<Report> ReportHandledByNavigations { get; set; } = new List<Report>();

    public virtual ICollection<Report> ReportReporters { get; set; } = new List<Report>();

    public virtual ICollection<SystemNotification> SystemNotifications { get; set; } = new List<SystemNotification>();

    public virtual ICollection<TeamJoinRequest> TeamJoinRequestRespondedByNavigations { get; set; } = new List<TeamJoinRequest>();

    public virtual ICollection<TeamJoinRequest> TeamJoinRequestUsers { get; set; } = new List<TeamJoinRequest>();

    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();

    public virtual UserProfile? UserProfile { get; set; }

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public virtual ICollection<ViolationReport> ViolationReportReportedUsers { get; set; } = new List<ViolationReport>();

    public virtual ICollection<ViolationReport> ViolationReportReporters { get; set; } = new List<ViolationReport>();
}
