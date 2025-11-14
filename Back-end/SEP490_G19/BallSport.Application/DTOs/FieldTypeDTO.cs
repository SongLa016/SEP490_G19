using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class FieldTypeDTO
    {
        public string TypeName { get; set; } = null!;
    }

    public class FieldTypeReadDTO
    {
        public int TypeId { get; set; }
        public string TypeName { get; set; } = null!;
    }
}
