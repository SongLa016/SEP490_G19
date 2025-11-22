using System;
using System.ComponentModel.DataAnnotations;

namespace BallSport.Infrastructure.Models;

public partial class FieldImage
{
    [Key]
    public int ImageId { get; set; }

    public int FieldId { get; set; }

    public string? ImageUrl { get; set; }

    public virtual Field Field { get; set; } = null!;
}
