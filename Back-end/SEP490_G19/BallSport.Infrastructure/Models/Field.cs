
using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class Field
{
    public int FieldId { get; set; }

    public int? ComplexId { get; set; }

    public int? TypeId { get; set; }

    public string Name { get; set; } = null!;

    public string? Size { get; set; }

    public string? GrassType { get; set; }

    public string? Description { get; set; }

    public byte[]? Image { get; set; }

    public decimal? PricePerHour { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? BankAccountId { get; set; }

    public virtual OwnerBankAccount? BankAccount { get; set; }

    public virtual ICollection<CancellationPolicy> CancellationPolicies { get; set; } = new List<CancellationPolicy>();

    public virtual FieldComplex? Complex { get; set; }

    public virtual ICollection<DepositPolicy> DepositPolicies { get; set; } = new List<DepositPolicy>();

    public virtual ICollection<FieldPrice> FieldPrices { get; set; } = new List<FieldPrice>();

    public virtual ICollection<FieldSchedule> FieldSchedules { get; set; } = new List<FieldSchedule>();

    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();

    public virtual FieldType? Type { get; set; }
}
