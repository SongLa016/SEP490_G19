using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class PlayerBankAccount
{
    public int BankAccountId { get; set; }

    public int UserId { get; set; }

    public string BankName { get; set; } = null!;

    public string? BankShortCode { get; set; }

    public string AccountNumber { get; set; } = null!;

    public string AccountHolder { get; set; } = null!;

    public bool? IsDefault { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
