using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Models
{
    public class FieldImage
    {
        [Key]
        public int ImageId { get; set; }
        public int FieldId { get; set; }
        public byte[] Image { get; set; } = null!;

        public Field Field { get; set; } = null!;
    }
}
